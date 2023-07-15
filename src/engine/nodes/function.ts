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

const FunctionString = `
/**
 * @returns {Promise<string>} Return JSON.stringify output. If you want to return any object, send it JSON.stringify. For null/undefined, return JSON.stringify({})
 * @see {@link https://docs.workflow-engine.com/Function_Task}
 */
async function handler() {
  return JSON.stringify({});
}
`;

const GuardString = `
/**
 * @returns {Promise<boolean>} Return boolean
 * @see {@link https://docs.workflow-engine.com/Guard_Task}
 */
async function handler() {
  return true;
}
`;

export type FunctionNode = typeof FunctionString | typeof GuardString;
