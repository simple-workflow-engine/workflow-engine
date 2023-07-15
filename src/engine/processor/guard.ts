import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import type { Task } from "../tasks";
import type { Utilities } from "../utilities";
import ism from "isolated-vm";

export class GuardProcessor {
  private logChild = logger.child({
    name: GuardProcessor.name,
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
          response: boolean;
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
    const [_, jailSetResultError] = await asyncHandler(
      Promise.all([
        jail.set("global", jail.derefInto()),
        jail.set("getWorkflowParams", getWorkflowParams),
        jail.set("getWorkflowGlobal", getWorkflowGlobal),
        jail.set("getWorkflowResults", getWorkflowResults),
        jail.set("logger", logger),
      ])
    );
    await Promise.all(Object.entries(utilities).map(async ([key, value]) => jail.set(key, value)));

    if (jailSetResultError) {
      this.logChild.error(`isolate-vm failed to set global`);
      this.logChild.error(jailSetResultError);
    }

    if (!task?.exec) {
      return [
        null,
        {
          message: "Exec not found",
          error: `No guard script found`,
          stackTrace: `Task id: ${task.id}, Task name: ${task.name}`,
        },
      ];
    }
    const [evalResult, evalResultError] = await asyncHandler(context.eval(task.exec));

    if (evalResultError) {
      if (evalResultError instanceof Error) {
        return [
          null,
          {
            message: evalResultError?.message,
            stackTrace: evalResultError?.stack,
            error: evalResultError?.name,
          },
        ];
      }
      return [
        null,
        {
          message: "Task script have runtime error",
          stackTrace: JSON.stringify(evalResultError),
        },
      ];
    }

    if (!evalResult) {
      return [
        {
          response: false,
        },
        null,
      ];
    } else {
      return [
        {
          response: true,
        },
        null,
      ];
    }
  }
}
