import type { WorkflowRuntimeDocument } from "../../models/index";
import { WorkflowRuntime } from "../../models/index";
import { Logger } from "../logger/index";
import type { Task } from "../tasks/index";

import { FunctionProcessor } from "./function";
import axios, { AxiosError } from "axios";

import { EnvironmentVariables } from "../../env/index";
import logger from "@/lib/utils/logger";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import { GuardProcessor } from "./guard";
import { WaitProcessor } from "./wait";

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
    const workflowRuntimeDataResult = await asyncHandler(WorkflowRuntime.findById(this.workflowRuntimeId));
    if (!workflowRuntimeDataResult.success) {
      this.logChild.error(`WorkflowRuntime findById failed for ${this.workflowRuntimeId}`);
      this.logChild.error(workflowRuntimeDataResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime findById failed for ${this.workflowRuntimeId}`,
          statusCode: 500,
        },
      ];
    }
    if (!workflowRuntimeDataResult.result) {
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

    const currentTask: Task | null | undefined = workflowRuntimeDataResult.result.tasks.find(
      (item) => item.name === this.taskName
    );

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

    if (currentTask.type === "FUNCTION") {
      return this.processFunctionTask(workflowRuntimeDataResult.result, currentTask);
    } else if (currentTask.type === "START") {
      return this.processStartTask(workflowRuntimeDataResult.result, currentTask);
    } else if (currentTask.type === "END") {
      return this.processEndTask(workflowRuntimeDataResult.result, currentTask);
    } else if (currentTask.type === "WAIT") {
      return this.processWaitTask(workflowRuntimeDataResult.result, currentTask);
    } else if (currentTask.type === "GUARD") {
      return this.processGuardTask(workflowRuntimeDataResult.result, currentTask);
    } else {
      this.logChild.error(
        `Unknown Task type received: ${currentTask.type} for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      return [
        null,
        {
          statusCode: 400,
          message: "Bad Request",
          error: `Unknown Task type received: ${currentTask.type} for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
        },
      ];
    }
  }

  private async processFunctionTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task
  ): Promise<
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
    const loggerObj = new Logger(workflowRuntimeData?.logs ?? [], this.taskName);

    const params = currentTask.params ?? {};

    const global: { [key: string]: any } = workflowRuntimeData?.global ?? {};

    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    const functionProcessor = new FunctionProcessor();
    const [functionResponse, functionResponseError] = await functionProcessor.process(
      params,
      global,
      loggerObj,
      resultMap,
      currentTask
    );

    if (functionResponseError) {
      this.logChild.error(`Task process failed for taskName: ${this.taskName}`);
      this.logChild.error(functionResponseError);
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
      [currentTask.name]: functionResponse?.response ?? {},
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
    const updatedRuntimeResult = await asyncHandler(
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
    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    const nextTasks = updatedTasks.filter((item) => currentTask.next.includes(item.name));
    nextTasks.forEach((task) => {
      if (task.type !== "LISTEN") {
        axios({
          method: "POST",
          baseURL: EnvVars.DEPLOYED_URL,
          url: "/workflow/process",
          data: {
            workflowRuntimeId: this.workflowRuntimeId,
            taskName: task.name,
          },
        }).catch((error) => {
          if (error instanceof AxiosError) {
            this.logChild.error(error?.response?.data);
          } else {
            this.logChild.error(error);
          }
        });
      }
    });

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

  private async processGuardTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task
  ): Promise<
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
    const loggerObj = new Logger(workflowRuntimeData?.logs ?? [], this.taskName);

    const params = currentTask.params ?? {};

    const global: { [key: string]: any } = workflowRuntimeData?.global ?? {};

    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    const guardProcessor = new GuardProcessor();
    const [guardResponse, guardResponseError] = await guardProcessor.process(
      params,
      global,
      loggerObj,

      resultMap,
      currentTask
    );

    if (guardResponseError) {
      this.logChild.error(`Task process failed for taskName: ${this.taskName}`);
      this.logChild.error(guardResponseError);
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
      [currentTask.name]: guardResponse?.response,
    };

    // Updated Task
    let updatedTasks: Task[] = [...workflowRuntimeData.tasks];
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
    const updatedRuntimeResult = await asyncHandler(
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

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    if (guardResponse?.response) {
      const nextTasks = updatedTasks.filter((item) => currentTask.next.includes(item.name));
      nextTasks.forEach((task) => {
        if (task.type !== "LISTEN") {
          axios({
            method: "POST",
            baseURL: EnvVars.DEPLOYED_URL,
            url: "/workflow/process",
            data: {
              workflowRuntimeId: this.workflowRuntimeId,
              taskName: task.name,
            },
          }).catch((error) => {
            if (error instanceof AxiosError) {
              this.logChild.error(error?.response?.data);
            } else {
              this.logChild.error(error);
            }
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

  private async processStartTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task
  ): Promise<
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
    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    // Updated Result
    let updatedResultMap = {
      ...resultMap,
      [currentTask.name]: {},
    };

    // Updated Task
    let updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex((task) => task.id === currentTask.id);
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: "completed",
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: "completed" | "pending" = "pending";
    const endTask = updatedTasks.find((task) => task.type === "END");
    const allCompleted = endTask?.status === "completed";
    if (allCompleted) {
      updatedWorkflowStatus = "completed";
    }

    // Updated Runtime
    const updatedRuntimeResult = await asyncHandler(
      WorkflowRuntime.updateOne(
        {
          _id: this.workflowRuntimeId,
        },
        {
          workflowResults: updatedResultMap,
          workflowStatus: updatedWorkflowStatus,
          tasks: updatedTasks,
        }
      )
    );

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    const nextTasks = updatedTasks.filter((item) => currentTask.next.includes(item.name));
    nextTasks.forEach((task) => {
      if (task.type !== "LISTEN") {
        axios({
          method: "POST",
          baseURL: EnvVars.DEPLOYED_URL,
          url: "/workflow/process",
          data: {
            workflowRuntimeId: this.workflowRuntimeId,
            taskName: task.name,
          },
        }).catch((error) => {
          if (error instanceof AxiosError) {
            this.logChild.error(error?.response?.data);
          } else {
            this.logChild.error(error);
          }
        });
      }
    });

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

  private async processEndTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task
  ): Promise<
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
    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    // Updated Result
    let updatedResultMap = {
      ...resultMap,
      [currentTask.name]: {},
    };

    // Updated Task
    let updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex((task) => task.id === currentTask.id);
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: "completed",
    };

    // Updated Workflow Status
    const updatedWorkflowStatus: "completed" | "pending" = "completed";

    // Updated Runtime
    const updatedRuntimeResult = await asyncHandler(
      WorkflowRuntime.updateOne(
        {
          _id: this.workflowRuntimeId,
        },
        {
          workflowResults: updatedResultMap,
          workflowStatus: updatedWorkflowStatus,
          tasks: updatedTasks,
        }
      )
    );

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
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

  private async processWaitTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task
  ): Promise<
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
    if (currentTask.status === "completed") {
      return [
        {
          statusCode: 200,
          message: "Task already processed successfully",
          data: {},
        },
        null,
      ];
    }
    const loggerObj = new Logger(workflowRuntimeData?.logs ?? [], this.taskName);
    let resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };
    const allTasks = workflowRuntimeData.tasks;
    const params = (currentTask.params ?? {
      taskNames: [],
    }) as {
      taskNames: string[];
    };

    const waitProcessor = new WaitProcessor();
    const [waitResponse, waitResponseError] = await waitProcessor.process(params, currentTask, allTasks);

    if (waitResponseError) {
      this.logChild.error(`Task process failed for taskName: ${this.taskName}`);
      this.logChild.error(waitResponseError);
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
      [currentTask.name]: waitResponse?.response,
    };

    // Updated Task
    let updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    if (waitResponse?.response) {
      const updateIndex = updatedTasks.findIndex((task) => task.id === currentTask.id);
      updatedTasks[updateIndex] = {
        ...updatedTasks[updateIndex],
        status: "completed",
      };
    }

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
    const updatedRuntimeResult = await asyncHandler(
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

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime updateOne failed for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${this.workflowRuntimeId} and taskName: ${this.taskName}`
      );
    }

    if (waitResponse?.response) {
      const nextTasks = updatedTasks.filter((item) => currentTask.next.includes(item.name));
      nextTasks.forEach((task) => {
        if (task.type !== "LISTEN") {
          axios({
            method: "POST",
            baseURL: EnvVars.DEPLOYED_URL,
            url: "/workflow/process",
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
