import { safeAsync } from '@lib/utils/safe';
import type { Task } from '../tasks';
import { performance } from 'node:perf_hooks';
import { createContext, runInNewContext, measureMemory } from 'vm';
import axios from 'axios';
import { LogSeverity, type WorkflowLogger } from '../logger';
import { ProcessorProcess } from '../engine.interface';

const httpClient = async (...args: any[]) => {
  const result: any = await axios.apply(this, args);
  return result.data;
};

export class GuardProcessor implements ProcessorProcess {
  async process(
    params: Record<string, any>,
    global: Record<string, any>,
    loggerObj: WorkflowLogger,
    results: Record<string, any>,
    task: Task,
  ): Promise<{
    response: boolean;
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
    const context = createContext({
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
      await runInNewContext(
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
      measureMemory({ mode: 'summary', context: context }).then((result) => {
        console.log(context?.workflowParams);
        return result.total?.jsMemoryEstimate;
      }),
    );

    const memoryUsage =
      (memoryResult.success ? memoryResult.data ?? 0 : 0) / 1024 / 1024;

    const tock = performance.now();

    const timeTaken = (tock - tick) / 1000;

    return {
      response: Boolean(evalResult.data),
      memoryUsage,
      timeTaken,
    };
  }
}
