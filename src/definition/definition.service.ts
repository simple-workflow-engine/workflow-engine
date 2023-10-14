import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Definition, DefinitionDocument } from './definition.schema';
import { InjectModel } from '@nestjs/mongoose';
import { safeAsync } from '@/lib/utils/safe';
import { Model, Types } from 'mongoose';
import { AddDefinitionDto } from './dto/add-workflow.dto';
import { EditDefinitionDto } from './dto/edit-definition.dto';
import { RuntimeDocument } from '@/runtime/runtime.schema';

@Injectable()
export class DefinitionService {
  private logger = new Logger(DefinitionService.name);

  constructor(
    @InjectModel(Definition.name)
    private definitionCollection: Model<Definition>,
  ) {}

  async definitionList(userId: string) {
    const workflowDefinitionsResult = await safeAsync(
      this.definitionCollection.find<
        Pick<
          DefinitionDocument,
          'name' | '_id' | 'status' | 'description' | 'createdAt' | 'updatedAt'
        >
      >(
        {
          userId,
        },
        {
          name: 1,
          _id: 1,
          status: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ),
    );

    if (workflowDefinitionsResult.success === false) {
      this.logger.error(`WorkflowDefinition find failed`);
      this.logger.error(workflowDefinitionsResult.error);

      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        statusCode: 500,
        error: `WorkflowDefinition find failed`,
      });
    }

    return {
      message: 'Definition List fetched successfully',
      data: workflowDefinitionsResult.data,
      statusCode: 200,
    };
  }

  async createDefinition(body: AddDefinitionDto, userId: string) {
    const createdWorkflowDefinitionResult = await safeAsync(
      this.definitionCollection.create([
        {
          name: body.workflowData.name,
          description: body.workflowData.description,
          global: body.workflowData.global,
          status: body.workflowData.status,
          tasks: body.workflowData.tasks,
          ...(body?.ui && {
            uiObject: {
              [body.key]: body.ui,
            },
          }),
          userId,
        },
      ]),
    );

    if (createdWorkflowDefinitionResult.success === false) {
      this.logger.error(`Workflow Definition create failed`);
      this.logger.error(createdWorkflowDefinitionResult.error);
      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        error: `Workflow Definition create failed`,
        statusCode: 500,
      });
    }

    return {
      message: 'Workflow Definition created successfully',
      statusCode: 201,
      data: { success: !!createdWorkflowDefinitionResult.data },
    };
  }

  async editDefinition(id: string, body: EditDefinitionDto, userId: string) {
    const updateResult = await safeAsync(
      this.definitionCollection.updateOne(
        {
          _id: id,
          userId,
        },
        {
          name: body.workflowData.name,
          description: body.workflowData.description,
          global: body.workflowData.global,
          status: body.workflowData.status,
          tasks: body.workflowData.tasks,
          ...(body?.ui && {
            uiObject: {
              [body.key]: body.ui,
            },
          }),
        },
      ),
    );

    if (updateResult.success === false) {
      this.logger.error(`Workflow Definition updateOne failed for ${id}`);
      this.logger.error(updateResult.error);
      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        error: `Workflow Definition updateOne failed for ${id}`,
        statusCode: 500,
      });
    }

    return {
      message: 'Workflow Definition updated successfully',
      statusCode: 200,
      data: { success: !!updateResult.data },
    };
  }

  async definitionDetail(id: string, userId: string) {
    const detailAggregateResult = await safeAsync(
      this.definitionCollection.aggregate<
        Pick<
          DefinitionDocument,
          '_id' | 'name' | 'description' | 'status' | 'createdAt' | 'updatedAt'
        > & {
          runtimes: Array<
            Pick<
              RuntimeDocument,
              '_id' | 'workflowStatus' | 'createdAt' | 'updatedAt'
            >
          >;
        }
      >([
        {
          $match: {
            _id: new Types.ObjectId(id),
            userId,
          },
        },
        {
          $lookup: {
            from: 'runtimes',
            localField: '_id',
            foreignField: 'workflowDefinitionId',
            as: 'runtimes',
            pipeline: [
              {
                $sort: {
                  createdAt: -1,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            'runtimes._id': 1,
            'runtimes.workflowStatus': 1,
            'runtimes.createdAt': 1,
            'runtimes.updatedAt': 1,
          },
        },
      ]),
    );

    if (detailAggregateResult.success === false) {
      this.logger.error(
        `WorkflowDefinition detail result aggregate failed for ${id}`,
      );
      this.logger.error(detailAggregateResult.error);

      throw new InternalServerErrorException({
        error: `WorkflowDefinition detail result aggregate failed for ${id}`,
        message: 'Internal Server Error',
        statusCode: 500,
      });
    }

    const workflowDefinition = detailAggregateResult?.data?.at(0);
    if (!workflowDefinition) {
      throw new NotFoundException({
        message: 'Not Found',
        error: `Can not find WorkflowDefinition for ${id}`,
        statusCode: 404,
      });
    }

    return {
      data: workflowDefinition,
      message: 'Workflow detail fetched successfullt',
      statusCode: 200,
    };
  }

  async getDefinition(id: string, userId: string) {
    const workflowDetailResult = await safeAsync(
      this.definitionCollection.findOne({ _id: id, userId }),
    );

    if (workflowDetailResult.success === false) {
      this.logger.error(`WorkflowDefinition findById failed for ${id}`);
      this.logger.error(workflowDetailResult.error);
      throw new InternalServerErrorException({
        error: `WorkflowDefinition findById failed for ${id}`,
        message: 'Internal Server Error',
        statusCode: 500,
      });
    }

    if (!workflowDetailResult.data) {
      throw new NotFoundException({
        error: `Can not found WorkflowDefinition for ${id}`,
        message: 'Not found',
        statusCode: 404,
      });
    }

    return {
      message: 'Workflow Definition fetched successfully',
      data: workflowDetailResult.data,
      statusCode: 200,
    };
  }
}
