import type { Utilities } from "../../engine/utilities/index";
import type { Task } from "../../engine/tasks/index";

export class FunctionProcessor {
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
  ) {
    console.log(params);
    console.log(global);
    console.log(logger);
    console.log(utilities);
    console.log(results);
    console.log(task);

    let errorData: any = null;
    let response: any = {};
    return {
      response: response,
      error: errorData,
    };
  }
}
