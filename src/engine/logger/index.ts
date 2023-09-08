import logger from "@/lib/utils/logger";
import type { Logger as LoggerObj } from "winston";

export class Logger {
  private loggerObj: LoggerObj;
  logs: string[] = [];
  taskName: string;

  constructor(taskName: string) {
    this.loggerObj = logger.child({
      name: `Workflow:${taskName}`,
    });
    this.taskName = taskName;
  }

  log(...message: any[]) {
    this.loggerObj.info(message);
    this.logs.push([new Date().toJSON(), this.taskName, JSON.stringify(message)].join(" : "));
  }

  addLogs(logs: string[]) {
    this.logs.push(...logs);
  }

  get Logs() {
    return this.logs;
  }
}
