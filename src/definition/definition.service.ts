import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Definition, DefinitionDocument } from './definition.schema';
import { InjectModel } from '@nestjs/mongoose';
import { safeAsync } from '@/lib/utils/safe';
import { Model } from 'mongoose';

@Injectable()
export class DefinitionService {
  private logger = new Logger(DefinitionService.name);

  constructor(
    @InjectModel(Definition.name)
    private definitionCollection: Model<Definition>,
  ) {}

  async definitionList() {
    const workflowDefinitionsResult = await safeAsync(
      this.definitionCollection.find<
        Pick<
          DefinitionDocument,
          'name' | '_id' | 'status' | 'description' | 'createdAt' | 'updatedAt'
        >
      >(
        {},
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

    return workflowDefinitionsResult.data;
  }
}
