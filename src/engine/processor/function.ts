import type { Task } from "../../engine/tasks/index";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import ism from "isolated-vm";
import logger from "@/lib/utils/logger";
import type { Logger } from "../logger";
import axios from "axios";

const httpClient = (params: {
  url: string;
  payload?: any;
  headers: Record<string, any>;
  method:
    | "get"
    | "GET"
    | "delete"
    | "DELETE"
    | "head"
    | "HEAD"
    | "options"
    | "OPTIONS"
    | "post"
    | "POST"
    | "put"
    | "PUT"
    | "patch"
    | "PATCH"
    | "purge"
    | "PURGE"
    | "link"
    | "LINK"
    | "unlink"
    | "UNLINK";
  queryParams?: Record<string, any>;
}) =>
  axios({
    method: params.method,
    url: params.url,
    ...(params?.payload && { data: params.payload }),
    headers: params.headers,
    ...(params?.queryParams && {
      params: params.queryParams,
    }),
  })
    .then((res) => ({ success: true, data: res }))
    .catch((error) => ({ success: false, error: error }));

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
    loggerObj: Logger,
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

    const logs: string[] = [];
    const addLog = (...message: any[]) => {
      this.logChild.info(message);
      logs.push([new Date().toJSON(), task.name, JSON.stringify(message)].join(" : "));
    };

    const ismObj = new ism.Isolate();

    const context = await ismObj.createContext();

    const jail = context.global;
    const jailSetResult = await asyncHandler(
      Promise.all([
        jail.set("global", jail.derefInto()),
        jail.set("getWorkflowParams", getWorkflowParams),
        jail.set("getWorkflowGlobal", getWorkflowGlobal),
        jail.set("getWorkflowResults", getWorkflowResults),
        jail.set("httpClient", httpClient, {
          promise: true,
        }),
        jail.set("logger", addLog),
      ])
    );

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
    const evalResult = await asyncHandler<string>(
      await context.eval(
        `
    ${task.exec}
    handler();
    `,
        {
          promise: true,
        }
      )
    );
    ismObj.dispose();

    loggerObj.addLogs(logs);

    if (!evalResult.success) {
      this.logChild.error(`Context Eval failed for ${task.name}`);
      this.logChild.error(evalResult.error);

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
      this.logChild.info(evalResult.result);
      this.logChild.error(`Result JSON parse failed for ${task.name}`);
      this.logChild.error(error);
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
