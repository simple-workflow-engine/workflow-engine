import type { Task } from '../../engine/tasks/index';
import { safeAsync } from '@lib/utils/safe';
import ism from 'isolated-vm';
import { LogSeverity, type WorkflowLogger } from '../logger';
import axios from 'axios';
import { ProcessorProcess } from '../engine.interface';

const httpClient = async (...args: any[]) => {
  const result: any = await axios.apply(this, args);
  return result.data;
};

export class FunctionProcessor implements ProcessorProcess {
  async process(
    params: Record<string, any>,
    global: Record<string, any>,
    loggerObj: WorkflowLogger,
    results: Record<string, any>,
    task: Task,
  ): Promise<{
    response: unknown;
  }> {
    const ismObj = new ism.Isolate();

    const context = await ismObj.createContext();

    const jail = context.global;

    await Promise.all([
      context.evalClosureSync(
        `
        globalThis.console = {
          log: $0,
          info: $1,
          warn: $2,
          error: $3
        }
      `,
        [
          (...args: any[]) => loggerObj.log(LogSeverity.log, ...args),
          (...args: any[]) => loggerObj.log(LogSeverity.info, ...args),
          (...args: any[]) => loggerObj.log(LogSeverity.warn, ...args),
          (...args: any[]) => loggerObj.log(LogSeverity.error, ...args),
        ],
      ),
      context.evalClosure(
        `
          {
            axios = function (...args) {
                return $0.apply(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } });
            };
          }
        `,
        [httpClient],
        { arguments: { reference: true } },
      ),
      jail.set('global', jail.derefInto()),
      jail.set('workflowParams', params, {
        copy: true,
      }),
      jail.set('workflowGlobal', global, {
        copy: true,
      }),
      jail.set('workflowResults', results, {
        copy: true,
      }),
    ]);

    const evalResult = await safeAsync(
      await context.eval(
        `
    ${task.exec}
    handler();
    `,
        {
          promise: true,
          copy: true,
        },
      ),
    );
    ismObj.dispose();

    if (evalResult.success === false) {
      throw evalResult.error;
    }

    if (!evalResult.data) {
      return {
        response: {},
      };
    }
    return {
      response: evalResult.data,
    };
  }
}
