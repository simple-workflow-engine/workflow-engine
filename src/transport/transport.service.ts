import { Definition } from '@/definition/definition.schema';
import { TaskStatus, TaskType } from '@/engine/tasks';
import { safeAsync } from '@/lib/utils/safe';
import { Runtime, RuntimeStatus } from '@/runtime/runtime.schema';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { Processor } from '@/engine/processor';
import { ProcessWorkflowDto } from './dto/process-workflow.dto';

@Injectable()
export class TransportService {
  private logger = new Logger(TransportService.name);

  constructor(
    @InjectModel(Definition.name)
    private definitionCollection: Model<Definition>,
    @InjectModel(Runtime.name) private runtimeCollection: Model<Runtime>,
    private processor: Processor,
  ) {}

  async startWorkflow(body: StartWorkflowDto, userId: string) {
    const definitionResult = await safeAsync(
      this.definitionCollection.findById(body.workflowDefinitionId),
    );

    if (definitionResult.success === false) {
      this.logger.error(
        `WorkflowDefinition findById failed for ${body.workflowDefinitionId}`,
      );
      this.logger.error(definitionResult.error);

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        statusCode: 500,
        error: `WorkflowDefinition findById failed for ${body.workflowDefinitionId}`,
      });
    }

    if (!definitionResult.data) {
      throw new NotFoundException({
        message: 'Not Found',
        statusCode: 404,
        error: `Invalid WorkflowDefinition Id: ${body.workflowDefinitionId}`,
      });
    }

    const runtimeResult = await safeAsync(
      this.runtimeCollection.create({
        workflowDefinitionId: definitionResult.data._id,
        workflowStatus: RuntimeStatus.pending,
        workflowResults: {},
        tasks: definitionResult.data.tasks.map((t) => ({
          ...t,
          status: TaskStatus.pending,
        })),
        global: {
          ...(definitionResult.data?.global && {
            ...definitionResult.data?.global,
          }),
          ...(body?.globalParams && { ...body?.globalParams }),
        },
        logs: [],
        userId,
      }),
    );

    if (runtimeResult.success === false) {
      this.logger.error(
        `WorkflowRuntime create failed for ${body.workflowDefinitionId}`,
      );
      this.logger.error(runtimeResult.error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Internal Server Error',
        error: `WorkflowRuntime create failed for ${body.workflowDefinitionId}`,
      });
    }

    if (!runtimeResult.data) {
      throw new NotFoundException({
        message: 'Not Found',
        statusCode: 404,
        error: `Can not create WorkflowRuntime for ${body.workflowDefinitionId}`,
      });
    }

    const startTaskName = runtimeResult.data.tasks.find(
      (val) => val.type === TaskType.START,
    )?.name;

    if (!startTaskName) {
      throw new BadRequestException({
        message: 'Bad Request',
        statusCode: 400,
        error: `Can not find START task of WorkflowRuntime ${body.workflowDefinitionId}`,
      });
    }

    safeAsync(
      this.processor.processTask(
        runtimeResult.data._id.toString(),
        startTaskName,
      ),
    );

    return {
      statusCode: 200,
      message: 'Start workflow invoked successfully',
      data: {
        ok: true,
      },
    };
  }

  async processWorkflow(body: ProcessWorkflowDto) {
    safeAsync(
      this.processor.processTask(body.workflowRuntimeId, body.taskName),
    );

    return {
      statusCode: 200,
      message: 'Process workflow invoked successfully',
      data: {
        ok: true,
      },
    };
  }
}
