import { Logger as NestLogger } from '@nestjs/common';

export class Logger {
  private loggerObj: NestLogger;
  logs: string[] = [];
  taskName: string;

  constructor(taskName: string) {
    this.loggerObj = new NestLogger(`Workflow:${taskName}`);
    this.taskName = taskName;
  }

  log(...message: any[]) {
    this.loggerObj.log(message);
    this.logs.push(
      [new Date().toJSON(), this.taskName, JSON.stringify(message)].join(' : '),
    );
  }

  addLogs(logs: string[]) {
    this.logs.push(...logs);
  }

  get Logs() {
    return this.logs;
  }
}
