import logger from "@/lib/utils/logger";
import type { Logger as LoggerObj } from "winston";

export class Logger {
  private loggerObj: LoggerObj;
  logs: string[] = [];
  taskName: string;

  constructor(logs: string[], taskName: string) {
    this.loggerObj = logger.child({
      name: `Workflow:${taskName}`,
    });
    this.taskName = taskName;
    this.logs = logs;
  }

  log(...message: any[]) {
    this.loggerObj.info(message);
    this.logs.push([new Date().toJSON(), this.taskName, JSON.stringify(message)].join(" : "));
  }
  get Logs() {
    return this.logs;
  }
}
