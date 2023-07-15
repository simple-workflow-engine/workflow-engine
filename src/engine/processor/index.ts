import { WorkflowRuntime } from "../../models/index";
import { Logger } from "../logger/index";
import type { Task } from "../tasks/index";
import { Utilities } from "../utilities/index";
import { FunctionProcessor } from "./function";
import axios from "axios";

import { EnvironmentVariables } from "../../env/index";
import logger from "@/lib/utils/logger";
import { asyncHandler } from "@/lib/utils/asyncHandler";

const envVarsObj = EnvironmentVariables.getInstance();

const EnvVars = envVarsObj.EnvVars;

export class Processor {
  private logChild = logger.child({
    name: Processor.name,
  });

  workflowRuntimeId: string;
  taskName: string;
  constructor(workflowRuntimeId: string, taskName: string) {
    this.workflowRuntimeId = workflowRuntimeId;
    this.taskName = taskName;
  }
  async processTask(): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        }
      ]
  > {
    const [workflowRuntimeData, workflowRuntimeDataError] = await asyncHandler(
      WorkflowRuntime.findById(this.workflowRuntimeId)
    );
    if (workflowRuntimeDataError) {
      this.logChild.error(`WorkflowRuntime findById failed for ${this.workflowRuntimeId}`);
      this.logChild.error(workflowRuntimeDataError);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime findById failed for ${this.workflowRuntimeId}`,
          statusCode: 500,
        },
      ];
    }
    if (!workflowRuntimeData) {
      this.logChild.error("Workflow Runtime Data not found");
      return [
        null,
        {
          message: "Bad Request",
          error: `Can not fetch runtime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 400,
        },
      ];
    }

    const currentTask: Task | null | undefined = workflowRuntimeData.tasks.find((item) => item.name === this.taskName);

    if (!currentTask) {
      this.logChild.error(`No currentTask found for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`);
      return [
        null,
        {
          message: "Bad Request",
          error: `No currentTask found for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 400,
        },
      ];
    }

    const loggerObj = new Logger(workflowRuntimeData?.logs ?? [], this.taskName);

    const params = currentTask.params ?? {};

    const utilities = new Utilities("127.0.0.1");

    const global: { [key: string]: any } = workflowRuntimeData?.global ?? {};

    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    let taskResult: any;
    let taskError: any;

    if (currentTask.type === "FUNCTION") {
      const functionProcessor = new FunctionProcessor();
      const [functionResponse, functionResponseError] = await functionProcessor.process(
        params,
        global,
        loggerObj.log,
        utilities,
        resultMap,
        currentTask
      );
      taskResult = functionResponse?.response;
      taskError = functionResponseError;
    } else if (currentTask.type === "START") {
    } else if (currentTask.type === "END") {
    } else if (currentTask.type === "WAIT") {
    } else {
      this.logChild.error(
        `Unknown Task type received: ${currentTask.type} for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    if (taskError) {
      this.logChild.error(`Task process failed for taskName: ${this.taskName}`);
      this.logChild.error(taskError);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Task process failed for taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    // Updated Result
    let updatedResultMap = {
      ...resultMap,
      [currentTask.name]: taskResult,
    };

    // Updated Task
    let updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex((task) => task.id === currentTask.id);
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: "completed",
    };

    // Updated Logs
    const updatedLogs = loggerObj.Logs;

    // Updated Workflow Status
    let updatedWorkflowStatus: "completed" | "pending" = "pending";
    const endTask = updatedTasks.find((task) => task.type === "END");
    const allCompleted = endTask?.status === "completed";
    if (allCompleted) {
      updatedWorkflowStatus = "completed";
    }

    // Updated Runtime
    const [updatedRuntime, updatedRuntimeError] = await asyncHandler(
      WorkflowRuntime.updateOne(
        {
          _id: this.workflowRuntimeId,
        },
        {
          workflowResults: updatedResultMap,
          workflowStatus: updatedWorkflowStatus,
          tasks: updatedTasks,
          logs: updatedLogs,
        }
      )
    );
    if (updatedRuntimeError) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeError);
    }

    if (!updatedRuntime) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    // Call Next Nodes
    if (currentTask.type !== "END") {
      const nextTasks = updatedTasks.filter((item) => currentTask.next.includes(item.name));
      nextTasks.forEach((task) => {
        if (task.type !== "LISTEN") {
          axios({
            method: "POST",
            baseURL: EnvVars.DEPLOYED_URL,
            url: "/process",
            data: {
              workflowRuntimeId: this.workflowRuntimeId,
              taskName: task.name,
            },
          });
        }
      });
    }

    return [
      {
        message: "Task processed successfully",
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }
}
