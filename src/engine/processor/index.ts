import { WorkflowRuntime } from "../../models/index";
import type { WorkflowRuntimeDocument } from "../../models/index";
import { Logger } from "../logger/index";
import type { Task } from "../tasks/index";
import { Utilities } from "../utilities/index";
import { FunctionProcessor } from "./function";
import axios from "axios";

import { EnvironmentVariables } from "../../env/index";

const envVarsObj = EnvironmentVariables.getInstance();

const EnvVars = envVarsObj.EnvVars;

export class Processor {
  workflowRuntimeId: string;
  taskName: string;
  constructor(workflowRuntimeId: string, taskName: string) {
    this.workflowRuntimeId = workflowRuntimeId;
    this.taskName = taskName;
  }
  async processTask() {
    let workflowRuntimeData: WorkflowRuntimeDocument | null = null;
    try {
      workflowRuntimeData = await WorkflowRuntime.findById(
        this.workflowRuntimeId
      );
    } catch (error) {
      console.error(
        `[error] WorkflowRuntime findById failed for ${this.workflowRuntimeId}`
      );
      console.error(error);
      return {
        message: "Internal Server Error",
        error: `WorkflowRuntime findById failed for ${this.workflowRuntimeId}`,
        statusCode: 500,
      };
    }
    if (!workflowRuntimeData) {
      console.error("Workflow Runtime Data not found");
      return {
        message: "Bad Request",
        error: `Can not fetch runtime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
        statusCode: 400,
      };
    }

    const currentTask: Task | null | undefined = workflowRuntimeData.tasks.find(
      (item) => item.name === this.taskName
    );

    if (!currentTask) {
      console.error(
        `No currentTask found for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      return {
        message: "Bad Request",
        error: `No currentTask found for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
        statusCode: 400,
      };
    }

    const loggerObj = new Logger(
      workflowRuntimeData?.logs ?? [],
      this.taskName
    );

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
      let data = await functionProcessor.process(
        params,
        global,
        loggerObj.log,
        utilities,
        resultMap,
        currentTask
      );
      taskResult = data.response;
      taskError = data.error;
    } else if (currentTask.type === "START") {
    } else if (currentTask.type === "END") {
    } else if (currentTask.type === "WAIT") {
    } else {
      console.error(
        `Unknown Task type received: ${currentTask.type} for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    if (taskError) {
      console.error(
        `[error] Task process failed for taskName: ${this.taskName}`
      );
      console.error(taskError);
      return {
        message: "Internal Server Error",
        error: `Task process failed for taskName: ${this.taskName}`,
        statusCode: 500,
      };
    }

    // Updated Result
    let updatedResultMap = {
      ...resultMap,
      [currentTask.name]: taskResult,
    };

    // Updated Task
    let updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: "completed",
    };

    // Updated Logs
    const updatedLogs = loggerObj.Logs;

    // Updated Workflow Status
    let updatedWorkflowStatus: "completed" | "pending" = "pending";
    const allCompleted = updatedTasks.every(
      (task) => task.status === "completed"
    );
    if (allCompleted) {
      updatedWorkflowStatus = "completed";
    }

    // Updated Runtime
    let updatedRuntime;
    try {
      updatedRuntime = await WorkflowRuntime.updateOne(
        {
          _id: this.workflowRuntimeId,
        },
        {
          workflowResults: updatedResultMap,
          workflowStatus: updatedWorkflowStatus,
          tasks: updatedTasks,
          logs: updatedLogs,
        }
      );
    } catch (error) {
      console.error(
        `[error] WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      console.error(error);
    }

    if (!updatedRuntime) {
      console.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    // Call Next Nodes
    if (currentTask.type !== "END") {
      const nextTasks = updatedTasks.filter((item) =>
        currentTask.next.includes(item.name)
      );
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

    return {
      message: "Task processed successfully",
      data: {
        updatedTasks,
        updatedResultMap,
        updatedWorkflowStatus,
      },
    };
  }
}
