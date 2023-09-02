import type { Utilities } from "../../engine/utilities/index";
import type { Task } from "../../engine/tasks/index";
import ism from "isolated-vm";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";

export class FunctionProcessor {
  private logChild = logger.child({
    name: FunctionProcessor.name,
  });

  constructor() {}

  async process(
    params: {
      [key: string]: any;
    },
    global: {
      [key: string]: any;
    },
    logger: Function,
    utilities: Utilities,
    results: {
      [key: string]: { [key: string]: any };
    },
    task: Task
  ): Promise<
    | [
        {
          response: Record<string, any>;
        },
        null
      ]
    | [
        null,
        {
          message: string;
          error?: string;
          stackTrace?: string;
        }
      ]
  > {
    const getWorkflowParams = () => params;
    const getWorkflowGlobal = () => global;
    const getWorkflowResults = () => results;

    const ismObj = new ism.Isolate();

    const context = await ismObj.createContext();

    const jail = context.global;
    const jailSetResult = await asyncHandler(
      Promise.all([
        jail.set("global", jail.derefInto()),
        jail.set("getWorkflowParams", getWorkflowParams),
        jail.set("getWorkflowGlobal", getWorkflowGlobal),
        jail.set("getWorkflowResults", getWorkflowResults),
        jail.set("logger", logger),
      ])
    );
    await Promise.all(Object.entries(utilities).map(async ([key, value]) => jail.set(key, value)));

    if (!jailSetResult.success) {
      this.logChild.error(`isolate-vm failed to set global`);
      this.logChild.error(jailSetResult.error);
    }

    if (!task?.exec) {
      return [
        null,
        {
          message: "Exec not found",
          error: `No function script found`,
          stackTrace: `Task id: ${task.id}, Task name: ${task.name}`,
        },
      ];
    }
    const evalResult = await asyncHandler(context.eval(task.exec));

    if (!evalResult.success) {
      if (evalResult.error instanceof Error) {
        return [
          null,
          {
            message: evalResult.error?.message,
            stackTrace: evalResult.error?.stack,
            error: evalResult.error?.name,
          },
        ];
      }
      return [
        null,
        {
          message: "Task script have runtime error",
          stackTrace: JSON.stringify(evalResult.error),
        },
      ];
    }

    if (!evalResult) {
      return [
        {
          response: {},
        },
        null,
      ];
    }

    try {
      const resultData = JSON.parse(evalResult.result);
      return [
        {
          response: resultData,
        },
        null,
      ];
    } catch (error) {
      if (error instanceof Error) {
        return [
          null,
          {
            message: error.message,
            stackTrace: error?.stack,
            error: error.name,
          },
        ];
      }
      return [
        null,
        {
          message: "Task result parse failed",
          stackTrace: `Task id: ${task.id}, Task name: ${task.name}`,
          error: "JSON.stringify failed",
        },
      ];
    }
  }
}
