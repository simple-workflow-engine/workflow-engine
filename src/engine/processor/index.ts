import { WorkflowLogger } from '../logger/index';
import {
  BadRequestException,
  Injectable,
  Logger as NestLogger,
} from '@nestjs/common';
import { TaskStatus, type Task, TaskType } from '../tasks/index';

import { FunctionProcessor } from './function';

import { safeAsync } from '@lib/utils/safe';
import { GuardProcessor } from './guard';
import { WaitProcessor } from './wait';

import { EngineService } from '../engine.service';
import {
  RuntimeDocument,
  RuntimeStatus,
  RuntimeStatusType,
} from '@/runtime/runtime.schema';
import { EngineTransport } from '../engine.transport';

@Injectable()
export class Processor {
  private logChild = new NestLogger(Processor.name);

  constructor(
    private engineService: EngineService,
    private transportService: EngineTransport,
  ) {}

  async processTask(workflowRuntimeId: string, taskName: string) {
    this.logChild.log(`Processing ${taskName} Started`);

    const workflowRuntimeData = await this.engineService.findCurrentRuntime(
      workflowRuntimeId,
    );

    if (!workflowRuntimeData) {
      throw new BadRequestException({
        message: 'Bad Request',
        error: `Can not fetch runtime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
        statusCode: 400,
      });
    }

    const currentTask: Task | null | undefined = workflowRuntimeData.tasks.find(
      (item) => item.name === taskName,
    );

    if (!currentTask) {
      this.logChild.error(
        `No currentTask found for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      throw new BadRequestException({
        message: 'Bad Request',
        error: `No currentTask found for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
        statusCode: 400,
      });
    }
    // Start Status
    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeId,
        currentTask.id,
        TaskStatus.started,
      ),
    );

    if (currentTask.type === 'FUNCTION') {
      return this.processFunctionTask(workflowRuntimeData, currentTask);
    } else if (currentTask.type === 'START') {
      return this.processStartTask(workflowRuntimeData, currentTask);
    } else if (currentTask.type === 'END') {
      return this.processEndTask(workflowRuntimeData, currentTask);
    } else if (currentTask.type === 'WAIT') {
      return this.processWaitTask(workflowRuntimeData, currentTask);
    } else if (currentTask.type === 'GUARD') {
      return this.processGuardTask(workflowRuntimeData, currentTask);
    } else {
      this.logChild.error(
        `Unknown Task type received: ${currentTask.type} for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      throw new BadRequestException({
        statusCode: 400,
        message: 'Bad Request',
        error: `Unknown Task type received: ${currentTask.type} for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      });
    }
  }

  private async processFunctionTask(
    workflowRuntimeData: RuntimeDocument,
    currentTask: Task,
  ): Promise<{
    status: 'success' | 'failure';
  }> {
    const loggerObj = new WorkflowLogger(currentTask.name);

    const params = currentTask.params ?? {};

    const global = workflowRuntimeData?.global ?? {};

    const resultMap = structuredClone(
      workflowRuntimeData.workflowResults ?? {},
    );

    const functionProcessor = new FunctionProcessor();
    const processResult = await safeAsync(
      functionProcessor.process(
        params,
        global,
        loggerObj,
        resultMap,
        currentTask,
      ),
    );

    if (processResult.success === false) {
      this.logChild.error(
        `Task process failed for taskName: ${currentTask.name}`,
      );
      this.logChild.error(processResult.error);

      // Fail Status
      await safeAsync(
        this.engineService.updateTaskStatus(
          workflowRuntimeData._id?.toString(),
          currentTask.id,
          TaskStatus.failed,
        ),
      );

      return {
        status: 'failure',
      };
    }

    // Updated Task
    const updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Logs
    const updatedLogs = loggerObj.Logs;

    // Updated Workflow Status
    let updatedWorkflowStatus: RuntimeStatusType = RuntimeStatus.pending;
    const endTask = updatedTasks.find((task) => task.type === TaskType['END']);
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = RuntimeStatus.completed;
    }

    // Updated Runtime
    await safeAsync(
      this.engineService.updateWorkflowResult(
        workflowRuntimeData._id.toString(),
        currentTask.name,
        processResult.data?.response,
      ),
    );

    if (updatedWorkflowStatus === RuntimeStatus.completed) {
      await safeAsync(
        this.engineService.updateWorkflowStatus(
          workflowRuntimeData._id.toString(),
          updatedWorkflowStatus,
        ),
      );
    }

    await safeAsync(
      this.engineService.updateRuntimeLogs(
        workflowRuntimeData._id.toString(),
        updatedLogs,
      ),
    );

    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeData._id?.toString(),
        currentTask.id,
        TaskStatus.completed,
      ),
    );

    const nextTasks = updatedTasks.filter(
      (item) =>
        currentTask.next.includes(item.name) && item.type !== TaskType.LISTEN,
    );
    nextTasks.forEach((task) => {
      this.transportService.processNextTask({
        workflowRuntimeId: workflowRuntimeData._id.toString(),
        taskName: task.name,
      });
    });

    return {
      status: 'success',
    };
  }

  private async processGuardTask(
    workflowRuntimeData: RuntimeDocument,
    currentTask: Task,
  ): Promise<{
    status: 'success' | 'failure';
  }> {
    const loggerObj = new WorkflowLogger(currentTask.name);

    const params = currentTask.params ?? {};

    const global = workflowRuntimeData?.global ?? {};

    const resultMap = structuredClone(
      workflowRuntimeData.workflowResults ?? {},
    );

    const guardProcessor = new GuardProcessor();
    const processResult = await safeAsync(
      guardProcessor.process(params, global, loggerObj, resultMap, currentTask),
    );

    if (processResult.success === false) {
      this.logChild.error(
        `Task process failed for taskName: ${currentTask.name}`,
      );
      this.logChild.error(processResult.error);

      // Fail Status
      await safeAsync(
        this.engineService.updateTaskStatus(
          workflowRuntimeData._id?.toString(),
          currentTask.id,
          TaskStatus.failed,
        ),
      );

      return {
        status: 'failure',
      };
    }

    // Updated Task
    const updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Logs
    const updatedLogs = loggerObj.Logs;

    // Updated Workflow Status
    let updatedWorkflowStatus: RuntimeStatusType = RuntimeStatus.pending;
    const endTask = updatedTasks.find((task) => task.type === TaskType['END']);
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = RuntimeStatus.completed;
    }

    // Updated Runtime
    await safeAsync(
      this.engineService.updateWorkflowResult(
        workflowRuntimeData._id.toString(),
        currentTask.name,
        processResult.data?.response,
      ),
    );

    if (updatedWorkflowStatus === RuntimeStatus.completed) {
      await safeAsync(
        this.engineService.updateWorkflowStatus(
          workflowRuntimeData._id.toString(),
          updatedWorkflowStatus,
        ),
      );
    }

    await safeAsync(
      this.engineService.updateRuntimeLogs(
        workflowRuntimeData._id.toString(),
        updatedLogs,
      ),
    );

    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeData._id?.toString(),
        currentTask.id,
        TaskStatus.completed,
      ),
    );

    if (processResult?.data) {
      const nextTasks = updatedTasks.filter(
        (item) =>
          currentTask.next.includes(item.name) && item.type !== TaskType.LISTEN,
      );
      nextTasks.forEach((task) => {
        this.transportService.processNextTask({
          workflowRuntimeId: workflowRuntimeData._id.toString(),
          taskName: task.name,
        });
      });
    }

    return {
      status: 'success',
    };
  }

  private async processStartTask(
    workflowRuntimeData: RuntimeDocument,
    currentTask: Task,
  ): Promise<{
    status: 'success' | 'failure';
  }> {
    // Updated Task
    const updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: RuntimeStatusType = RuntimeStatus.pending;
    const endTask = updatedTasks.find((task) => task.type === TaskType['END']);
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = RuntimeStatus.completed;
    }

    // Updated Runtime
    await safeAsync(
      this.engineService.updateWorkflowResult(
        workflowRuntimeData._id.toString(),
        currentTask.name,
        {},
      ),
    );

    if (updatedWorkflowStatus === RuntimeStatus.completed) {
      await safeAsync(
        this.engineService.updateWorkflowStatus(
          workflowRuntimeData._id.toString(),
          updatedWorkflowStatus,
        ),
      );
    }

    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeData._id?.toString(),
        currentTask.id,
        TaskStatus.completed,
      ),
    );

    const nextTasks = updatedTasks.filter(
      (item) =>
        currentTask.next.includes(item.name) && item.type !== TaskType.LISTEN,
    );
    nextTasks.forEach((task) => {
      this.transportService.processNextTask({
        workflowRuntimeId: workflowRuntimeData._id.toString(),
        taskName: task.name,
      });
    });

    return {
      status: 'success',
    };
  }

  private async processEndTask(
    workflowRuntimeData: RuntimeDocument,
    currentTask: Task,
  ): Promise<{
    status: 'success' | 'failure';
  }> {
    // Updated Task
    const updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: RuntimeStatusType = RuntimeStatus.pending;
    const endTask = updatedTasks.find((task) => task.type === TaskType['END']);
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = RuntimeStatus.completed;
    }

    // Updated Runtime
    await safeAsync(
      this.engineService.updateWorkflowResult(
        workflowRuntimeData._id.toString(),
        currentTask.name,
        {},
      ),
    );

    if (updatedWorkflowStatus === RuntimeStatus.completed) {
      await safeAsync(
        this.engineService.updateWorkflowStatus(
          workflowRuntimeData._id.toString(),
          updatedWorkflowStatus,
        ),
      );
    }

    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeData._id?.toString(),
        currentTask.id,
        TaskStatus.completed,
      ),
    );

    return {
      status: 'success',
    };
  }

  private async processWaitTask(
    workflowRuntimeData: RuntimeDocument,
    currentTask: Task,
  ): Promise<{
    status: 'success' | 'failure';
  }> {
    if (currentTask.status === TaskStatus.completed) {
      return {
        status: 'success',
      };
    }

    const allTasks = workflowRuntimeData.tasks;

    const waitProcessor = new WaitProcessor();
    const processResult = await safeAsync(
      waitProcessor.process(currentTask.params?.taskNames ?? [], allTasks),
    );

    if (processResult.success === false) {
      this.logChild.error(
        `Task process failed for taskName: ${currentTask.name}`,
      );
      this.logChild.error(processResult.error);

      // Fail Status
      await safeAsync(
        this.engineService.updateTaskStatus(
          workflowRuntimeData._id?.toString(),
          currentTask.id,
          TaskStatus.failed,
        ),
      );

      return {
        status: 'failure',
      };
    }

    // Updated Task
    const updatedTasks: Task[] = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: RuntimeStatusType = RuntimeStatus.pending;
    const endTask = updatedTasks.find((task) => task.type === TaskType['END']);
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = RuntimeStatus.completed;
    }

    // Updated Runtime
    await safeAsync(
      this.engineService.updateWorkflowResult(
        workflowRuntimeData._id.toString(),
        currentTask.name,
        processResult.data?.response,
      ),
    );

    if (updatedWorkflowStatus === RuntimeStatus.completed) {
      await safeAsync(
        this.engineService.updateWorkflowStatus(
          workflowRuntimeData._id.toString(),
          updatedWorkflowStatus,
        ),
      );
    }

    await safeAsync(
      this.engineService.updateTaskStatus(
        workflowRuntimeData._id?.toString(),
        currentTask.id,
        TaskStatus.completed,
      ),
    );

    if (processResult?.data) {
      const nextTasks = updatedTasks.filter(
        (item) =>
          currentTask.next.includes(item.name) && item.type !== TaskType.LISTEN,
      );
      nextTasks.forEach((task) => {
        this.transportService.processNextTask({
          workflowRuntimeId: workflowRuntimeData._id.toString(),
          taskName: task.name,
        });
      });
    }

    return {
      status: 'success',
    };
  }
}
