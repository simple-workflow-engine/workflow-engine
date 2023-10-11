import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Definition, DefinitionDocument } from './definition.schema';
import { InjectModel } from '@nestjs/mongoose';
import { safeAsync } from '@/lib/utils/safe';
import { Model } from 'mongoose';
import { AddWorkflowDto } from './dto/add-workflow.dto';

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

  async addWorkflow(body: AddWorkflowDto) {
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
}
