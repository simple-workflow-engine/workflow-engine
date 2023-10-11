import {
  Runtime,
  RuntimeDocument,
  RuntimeStatus,
} from '@/runtime/runtime.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskStatusType } from './tasks';
import { LogObject } from './logger';

@Injectable()
export class EngineService {
  constructor(
    @InjectModel(Runtime.name) private runtimeCollection: Model<Runtime>,
  ) {}

  async findCurrentRuntime(id: string) {
    return await this.runtimeCollection.findById<RuntimeDocument>(id);
  }

  async updateTaskStatus(
    workflowRuntimeId: string,
    currentTaskId: string,
    newStatus: TaskStatusType,
  ) {
    return await this.runtimeCollection.updateOne(
      {
        _id: workflowRuntimeId,
        'tasks.id': currentTaskId,
      },
      {
        $set: { 'tasks.$.status': newStatus },
      },
    );
  }

  async updateWorkflowResult(
    workflowRuntimeId: string,
    currentTaskName: string,
    result: unknown,
  ) {
    return await this.runtimeCollection.updateOne(
      {
        _id: workflowRuntimeId,
      },
      {
        $set: {
          [`workflowResults.${currentTaskName}`]: result ?? {},
        },
      },
    );
  }

  async updateWorkflowStatus(
    workflowRuntimeId: string,
    newStatus: RuntimeStatus,
  ) {
    return await this.runtimeCollection.updateOne(
      {
        _id: workflowRuntimeId,
      },
      {
        workflowStatus: newStatus,
      },
    );
  }

  async updateRuntimeLogs(workflowRuntimeId: string, logs: LogObject[]) {
    return await this.runtimeCollection.updateOne(
      {
        _id: workflowRuntimeId,
      },
      {
        $push: {
          logs: {
            $each: logs,
          },
        },
      },
    );
  }
}
