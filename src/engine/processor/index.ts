import { Logger } from '../logger/index';
import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { TaskStatus, type Task } from '../tasks/index';

import { FunctionProcessor } from './function';
import axios, { AxiosError } from 'axios';

import { safeAsync } from '@lib/utils/safe';
import { GuardProcessor } from './guard';
import { WaitProcessor } from './wait';

import { EngineService } from '../engine.service';

@Injectable()
export class Processor {
  private logChild = new NestLogger(Processor.name);

  constructor(private engineService: EngineService) {}

  async processTask(
    workflowRuntimeId: string,
    taskName: string,
  ): Promise<{
    message: string;
    data: Record<string, any>;
    statusCode: number;
  }> {
    this.logChild.log(`Processing ${taskName} Started`);

    const workflowRuntimeDataResult = await safeAsync(
      this.runtimeCollection.findById(workflowRuntimeId),
    );
    if (workflowRuntimeDataResult.success === false) {
      this.logChild.error(
        `WorkflowRuntime findById failed for ${workflowRuntimeId}`,
      );
      this.logChild.error(workflowRuntimeDataResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime findById failed for ${workflowRuntimeId}`,
          statusCode: 500,
        },
      ];
    }
    if (!workflowRuntimeDataResult.data) {
      this.logChild.error('Workflow Runtime Data not found');
      return [
        null,
        {
          message: 'Bad Request',
          error: `Can not fetch runtime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 400,
        },
      ];
    }

    const currentTask: Task | null | undefined =
      workflowRuntimeDataResult.data.tasks.find(
        (item) => item.name === taskName,
      );

    if (!currentTask) {
      this.logChild.error(
        `No currentTask found for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      return [
        null,
        {
          message: 'Bad Request',
          error: `No currentTask found for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 400,
        },
      ];
    }
    // Start Status
    await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.started },
        },
      ),
    );

    if (currentTask.type === 'FUNCTION') {
      return this.processFunctionTask(
        workflowRuntimeDataResult.result,
        currentTask,
      );
    } else if (currentTask.type === 'START') {
      return this.processStartTask(
        workflowRuntimeDataResult.result,
        currentTask,
      );
    } else if (currentTask.type === 'END') {
      return this.processEndTask(workflowRuntimeDataResult.result, currentTask);
    } else if (currentTask.type === 'WAIT') {
      return this.processWaitTask(
        workflowRuntimeDataResult.result,
        currentTask,
      );
    } else if (currentTask.type === 'GUARD') {
      return this.processGuardTask(
        workflowRuntimeDataResult.result,
        currentTask,
      );
    } else {
      this.logChild.error(
        `Unknown Task type received: ${currentTask.type} for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      return [
        null,
        {
          statusCode: 400,
          message: 'Bad Request',
          error: `Unknown Task type received: ${currentTask.type} for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
        },
      ];
    }
  }

  private async processFunctionTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task,
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        },
      ]
  > {
    const loggerObj = new Logger(taskName);

    const params = currentTask.params ?? {};

    const global: { [key: string]: any } = workflowRuntimeData?.global ?? {};

    const resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    const functionProcessor = new FunctionProcessor();
    const [functionResponse, functionResponseError] =
      await functionProcessor.process(
        params,
        global,
        loggerObj,
        resultMap,
        currentTask,
      );

    if (functionResponseError) {
      this.logChild.error(`Task process failed for taskName: ${taskName}`);
      this.logChild.error(functionResponseError);

      // Fail Status
      await safeAsync(
        WorkflowRuntime.updateOne(
          {
            _id: workflowRuntimeId,
            'tasks.id': currentTask.id,
          },
          {
            $set: { 'tasks.$.status': TaskStatus.failed },
          },
        ),
      );

      return [
        null,
        {
          message: 'Internal Server Error',
          error: `Task process failed for taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    // Updated Result
    const updatedResultMap = {
      ...resultMap,
      [currentTask.name]: functionResponse?.response ?? {},
    };

    // Updated Task
    const updatedTasks = [...workflowRuntimeData.tasks];
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
    let updatedWorkflowStatus: 'completed' | 'pending' = 'pending';
    const endTask = updatedTasks.find((task) => task.type === 'END');
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = 'completed';
    }

    // Updated Runtime
    const updatedRuntimeResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
        },
        {
          $set: {
            [`workflowResults.${currentTask.name}`]:
              functionResponse?.response ?? {},
          },
          ...(updatedWorkflowStatus === 'completed' && {
            workflowStatus: updatedWorkflowStatus,
          }),
          $push: {
            logs: {
              $each: updatedLogs,
            },
          },
        },
      ),
    );

    const updatedRuntimeTaskResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.completed },
        },
      ),
    );

    if (!updatedRuntimeTaskResult.success) {
      this.logChild.error(
        `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeTaskResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
    }

    const nextTasks = updatedTasks.filter((item) =>
      currentTask.next.includes(item.name),
    );
    nextTasks.forEach((task) => {
      if (task.type !== 'LISTEN') {
        axios({
          method: 'POST',
          baseURL: EnvVars.DEPLOYED_URL,
          url: '/workflow/process',
          data: {
            workflowRuntimeId: workflowRuntimeId,
            taskName: task.name,
          },
        }).catch((error) => {
          if (error instanceof AxiosError) {
            this.logChild.error(error?.response?.data);
          } else {
            this.logChild.error(error);
          }
        });
      }
    });

    return [
      {
        message: 'Task processed successfully',
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }

  private async processGuardTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task,
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        },
      ]
  > {
    const loggerObj = new Logger(taskName);

    const params = currentTask.params ?? {};

    const global: { [key: string]: any } = workflowRuntimeData?.global ?? {};

    const resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    const guardProcessor = new GuardProcessor();
    const [guardResponse, guardResponseError] = await guardProcessor.process(
      params,
      global,
      loggerObj,

      resultMap,
      currentTask,
    );

    if (guardResponseError) {
      this.logChild.error(`Task process failed for taskName: ${taskName}`);
      this.logChild.error(guardResponseError);

      // Fail Status
      await safeAsync(
        WorkflowRuntime.updateOne(
          {
            _id: workflowRuntimeId,
            'tasks.id': currentTask.id,
          },
          {
            $set: { 'tasks.$.status': TaskStatus.failed },
          },
        ),
      );

      return [
        null,
        {
          message: 'Internal Server Error',
          error: `Task process failed for taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    // Updated Result
    const updatedResultMap = {
      ...resultMap,
      [currentTask.name]: guardResponse?.response ?? {},
    };

    // Updated Task
    const updatedTasks = [...workflowRuntimeData.tasks];
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
    let updatedWorkflowStatus: 'completed' | 'pending' = 'pending';
    const endTask = updatedTasks.find((task) => task.type === 'END');
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = 'completed';
    }

    // Updated Runtime
    const updatedRuntimeResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
        },
        {
          $set: {
            [`workflowResults.${currentTask.name}`]:
              guardResponse?.response ?? {},
          },
          ...(updatedWorkflowStatus === 'completed' && {
            workflowStatus: updatedWorkflowStatus,
          }),
          $push: {
            logs: {
              $each: updatedLogs,
            },
          },
        },
      ),
    );

    const updatedRuntimeTaskResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.completed },
        },
      ),
    );

    if (!updatedRuntimeTaskResult.success) {
      this.logChild.error(
        `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeTaskResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
    }

    if (guardResponse?.response) {
      const nextTasks = updatedTasks.filter((item) =>
        currentTask.next.includes(item.name),
      );
      nextTasks.forEach((task) => {
        if (task.type !== 'LISTEN') {
          axios({
            method: 'POST',
            baseURL: EnvVars.DEPLOYED_URL,
            url: '/workflow/process',
            data: {
              workflowRuntimeId: workflowRuntimeId,
              taskName: task.name,
            },
          }).catch((error) => {
            if (error instanceof AxiosError) {
              this.logChild.error(error?.response?.data);
            } else {
              this.logChild.error(error);
            }
          });
        }
      });
    }

    return [
      {
        message: 'Task processed successfully',
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }

  private async processStartTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task,
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        },
      ]
  > {
    const resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    // Updated Result
    const updatedResultMap = {
      ...resultMap,
      [currentTask.name]: {},
    };

    // Updated Task
    const updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: 'completed' | 'pending' = 'pending';
    const endTask = updatedTasks.find((task) => task.type === 'END');
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = 'completed';
    }

    // Updated Runtime
    const updatedRuntimeResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
        },
        {
          $set: {
            [`workflowResults.${currentTask.name}`]: {},
          },
          ...(updatedWorkflowStatus === 'completed' && {
            workflowStatus: updatedWorkflowStatus,
          }),
        },
      ),
    );

    const updatedRuntimeTaskResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.completed },
        },
      ),
    );

    if (!updatedRuntimeTaskResult.success) {
      this.logChild.error(
        `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeTaskResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
    }

    const nextTasks = updatedTasks.filter((item) =>
      currentTask.next.includes(item.name),
    );
    nextTasks.forEach((task) => {
      if (task.type !== 'LISTEN') {
        axios({
          method: 'POST',
          baseURL: EnvVars.DEPLOYED_URL,
          url: '/workflow/process',
          data: {
            workflowRuntimeId: workflowRuntimeId,
            taskName: task.name,
          },
        }).catch((error) => {
          if (error instanceof AxiosError) {
            this.logChild.error(error?.response?.data);
          } else {
            this.logChild.error(error);
          }
        });
      }
    });

    return [
      {
        message: 'Task processed successfully',
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }

  private async processEndTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task,
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        },
      ]
  > {
    const resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };

    // Updated Result
    const updatedResultMap = {
      ...resultMap,
      [currentTask.name]: {},
    };

    // Updated Task
    const updatedTasks = [...workflowRuntimeData.tasks];
    const updateIndex = updatedTasks.findIndex(
      (task) => task.id === currentTask.id,
    );
    updatedTasks[updateIndex] = {
      ...updatedTasks[updateIndex],
      status: TaskStatus.completed,
    };

    // Updated Workflow Status
    let updatedWorkflowStatus: 'completed' | 'pending' = 'pending';
    const endTask = updatedTasks.find((task) => task.type === 'END');
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = 'completed';
    }

    // Updated Runtime
    const updatedRuntimeResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
        },
        {
          $set: {
            [`workflowResults.${currentTask.name}`]: {},
          },
          ...(updatedWorkflowStatus === 'completed' && {
            workflowStatus: updatedWorkflowStatus,
          }),
        },
      ),
    );

    const updatedRuntimeTaskResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.completed },
        },
      ),
    );

    if (!updatedRuntimeTaskResult.success) {
      this.logChild.error(
        `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeTaskResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
    }

    return [
      {
        message: 'Task processed successfully',
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }

  private async processWaitTask(
    workflowRuntimeData: WorkflowRuntimeDocument,
    currentTask: Task,
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
          statusCode: number;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        },
      ]
  > {
    if (currentTask.status === TaskStatus.completed) {
      return [
        {
          statusCode: 200,
          message: 'Task already processed successfully',
          data: {},
        },
        null,
      ];
    }
    const loggerObj = new Logger(taskName);
    const resultMap: {
      [key: string]: { [key: string]: any };
    } = { ...workflowRuntimeData.workflowResults };
    const allTasks = workflowRuntimeData.tasks;
    const params = (currentTask.params ?? {
      taskNames: [],
    }) as {
      taskNames: string[];
    };

    const waitProcessor = new WaitProcessor();
    const [waitResponse, waitResponseError] = await waitProcessor.process(
      params,
      currentTask,
      allTasks,
    );

    if (waitResponseError) {
      this.logChild.error(`Task process failed for taskName: ${taskName}`);
      this.logChild.error(waitResponseError);

      // Fail Status
      await safeAsync(
        WorkflowRuntime.updateOne(
          {
            _id: workflowRuntimeId,
            'tasks.id': currentTask.id,
          },
          {
            $set: { 'tasks.$.status': TaskStatus.failed },
          },
        ),
      );

      return [
        null,
        {
          message: 'Internal Server Error',
          error: `Task process failed for taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    // Updated Result
    const updatedResultMap = {
      ...resultMap,
      [currentTask.name]: waitResponse?.response ?? {},
    };

    // Updated Task
    const updatedTasks = [...workflowRuntimeData.tasks];
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
    let updatedWorkflowStatus: 'completed' | 'pending' = 'pending';
    const endTask = updatedTasks.find((task) => task.type === 'END');
    const allCompleted = endTask?.status === 'completed';
    if (allCompleted) {
      updatedWorkflowStatus = 'completed';
    }

    // Updated Runtime
    const updatedRuntimeResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
        },
        {
          $set: {
            [`workflowResults.${currentTask.name}`]:
              waitResponse?.response ?? {},
          },
          ...(updatedWorkflowStatus === 'completed' && {
            workflowStatus: updatedWorkflowStatus,
          }),
          $push: {
            logs: {
              $each: updatedLogs,
            },
          },
        },
      ),
    );

    const updatedRuntimeTaskResult = await safeAsync(
      WorkflowRuntime.updateOne(
        {
          _id: workflowRuntimeId,
          'tasks.id': currentTask.id,
        },
        {
          $set: { 'tasks.$.status': TaskStatus.completed },
        },
      ),
    );

    if (!updatedRuntimeTaskResult.success) {
      this.logChild.error(
        `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeTaskResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime Task updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.success) {
      this.logChild.error(
        `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
      this.logChild.error(updatedRuntimeResult.error);
      return [
        null,
        {
          message: 'Internal Server Error',
          error: `WorkflowRuntime updateOne failed for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    if (!updatedRuntimeResult.result) {
      this.logChild.error(
        `Can not update WorkflowRuntime for runtime: ${workflowRuntimeId} and taskName: ${taskName}`,
      );
    }

    if (waitResponse?.response) {
      const nextTasks = updatedTasks.filter((item) =>
        currentTask.next.includes(item.name),
      );
      nextTasks.forEach((task) => {
        if (task.type !== 'LISTEN') {
          axios({
            method: 'POST',
            baseURL: EnvVars.DEPLOYED_URL,
            url: '/workflow/process',
            data: {
              workflowRuntimeId: workflowRuntimeId,
              taskName: task.name,
            },
          });
        }
      });
    }

    return [
      {
        message: 'Task processed successfully',
        data: {
          updatedTasks,
          updatedResultMap,
          updatedWorkflowStatus,
        },
        statusCode: 200,
      },
      null,
    ];
  }
}
