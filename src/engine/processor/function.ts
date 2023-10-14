import type { Task } from '../../engine/tasks/index';
import { safeAsync } from '@lib/utils/safe';
import { performance } from 'node:perf_hooks';
import vm from 'vm';

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
    /**
     * In Seconds
     */
    timeTaken: number;
    /**
     * In MB
     */
    memoryUsage: number;
  }> {
    const tick = performance.now();
    const context = vm.createContext({
      console: {
        log: (...args: any[]) => loggerObj.log(LogSeverity.log, ...args),
        info: (...args: any[]) => loggerObj.log(LogSeverity.info, ...args),
        warn: (...args: any[]) => loggerObj.log(LogSeverity.warn, ...args),
        error: (...args: any[]) => loggerObj.log(LogSeverity.error, ...args),
      },
      axios: httpClient,
      workflowParams: params,
      workflowGlobal: global,
      workflowResults: results,
    });

    const evalResult = await safeAsync(
      await vm.runInNewContext(
        `
    ${task.exec}
    handler();
    `,
        context,
        {},
      ),
    );

    if (evalResult.success === false) {
      throw evalResult.error;
    }

    const memoryResult = await safeAsync(
      vm.measureMemory({ mode: 'summary', context: context }).then((result) => {
        console.log(context?.consts);
        return result.total?.jsMemoryEstimate;
      }),
    );

    const memoryUsage =
      (memoryResult.success ? memoryResult.data ?? 0 : 0) / 1024 / 1024;

    const tock = performance.now();

    const timeTaken = (tock - tick) / 1000;

    if (!evalResult.data) {
      return {
        response: {},
        memoryUsage,
        timeTaken,
      };
    }
    return {
      response: evalResult.data,
      memoryUsage,
      timeTaken,
    };
  }
}
