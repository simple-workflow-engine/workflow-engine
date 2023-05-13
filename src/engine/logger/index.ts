export class Logger {
  logs: string[] = [];
  taskName: string;

  constructor(logs: string[], taskName: string) {
    this.taskName = taskName;
    this.logs = logs;
  }

  log(...message: any[]) {
    console.log(message);
    this.logs.push(
      [new Date().toJSON(), this.taskName, JSON.stringify(message)].join(" : ")
    );
  }
  get Logs() {
    return this.logs;
  }
}
