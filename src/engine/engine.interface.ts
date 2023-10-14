import type { WorkflowLogger } from './logger';
import type { Task } from './tasks';

export interface ProcessorProcess {
  process(
    params: Record<string, any>,
    global: Record<string, any>,
    loggerObj: WorkflowLogger,
    results: Record<string, any>,
    task: Task,
  ): Promise<{ response: unknown }>;
}
