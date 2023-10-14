import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Runtime, RuntimeDocument } from './runtime.schema';
import { Model, Types } from 'mongoose';
import { safeAsync } from '@/lib/utils/safe';
import { DefinitionDocument } from '@/definition/definition.schema';

@Injectable()
export class RuntimeService {
  private logger = new Logger(RuntimeService.name);

  constructor(
    @InjectModel(Runtime.name) private runtimeCollection: Model<Runtime>,
  ) {}

  async getRuntimeDetail(id: string) {
    const runtimeResult = await safeAsync(
      this.runtimeCollection.aggregate<
        Pick<
          RuntimeDocument,
          | '_id'
          | 'workflowStatus'
          | 'tasks'
          | 'logs'
          | 'workflowResults'
          | 'createdAt'
          | 'updatedAt'
        > & {
          definition: Pick<
            DefinitionDocument,
            '_id' | 'name' | 'status' | 'description'
          >;
        }
      >([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'definitions',
            localField: 'workflowDefinitionId',
            foreignField: '_id',
            as: 'definition',
          },
        },
        {
          $unwind: {
            path: '$definition',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            workflowStatus: 1,
            tasks: 1,
            logs: 1,
            createdAt: 1,
            updatedAt: 1,
            'definition._id': 1,
            'definition.name': 1,
            'definition.status': 1,
            'definition.description': 1,
            'definition.createdAt': 1,
            'definition.updatedAt': 1,
            workflowResults: 1,
          },
        },
      ]),
    );

    if (runtimeResult.success === false) {
      this.logger.error(`Runtime detail result aggregate failed for ${id}`);
      this.logger.error(runtimeResult.error);
      throw new InternalServerErrorException({
        message: 'Internal Server Error',
        error: `Runtime detail result aggregate failed for ${id}`,
        statusCode: 500,
      });
    }

    const runtime = runtimeResult.data?.at(0);

    if (!runtime) {
      throw new NotFoundException({
        message: 'Not Found',
        error: `Can not find Runtime for ${id}`,
        statusCode: 404,
      });
    }

    return {
      data: runtime,
      message: 'Runtime detail fetched successfully',
      statusCode: 200,
    };
  }
}
