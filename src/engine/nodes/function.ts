import type { Utilities } from "../utilities/index";
import type { Task } from "../tasks/index";

export type Context = {
  params: {
    [key: string]: any;
  };
  global: {
    [key: string]: any;
  };
  logger: Function;
  utilities: Utilities;
  results: {
    [key: string]: { [key: string]: any };
  };
  task: Task;
};

export type ResultMap = {
  [key: string]: any;
};

async function exec(context: Context): Promise<ResultMap> {
  context.logger("Hello");
  return {};
}

export type FunctionNode = typeof exec;
