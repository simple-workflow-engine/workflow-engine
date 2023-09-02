import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import type { WorkflowDefinitionDocument } from "@/models";
import { WorkflowDefinition } from "@/models";
import type { AddWorkflowBody } from "./definition.dto";

export class DefinitionService {
  private logChild = logger.child({
    name: DefinitionService.name,
  });

  constructor() {}

  public async getWorkflows(): Promise<
    | [
        {
          message: string;
          data: WorkflowDefinitionDocument[];
          statusCode: number;
        },
        null
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        }
      ]
  > {
    const workflowDefinitionsResult = await asyncHandler(
      WorkflowDefinition.find<WorkflowDefinitionDocument>(
        {},
        {
          name: 1,
          _id: 1,
          status: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      )
    );

    if (!workflowDefinitionsResult.success) {
      this.logChild.error(`WorkflowDefinition find failed`);
      this.logChild.error(workflowDefinitionsResult.error);

      return [
        null,
        {
          message: "Internal Server Error",
          statusCode: 500,
          error: `WorkflowDefinition find failed`,
        },
      ];
    }

    return [
      {
        message: "WorkflowDefinition fetched successfully",
        statusCode: 200,
        data: workflowDefinitionsResult.result ?? [],
      },
      null,
    ];
  }

  public async addWorkflow(definitionData: AddWorkflowBody): Promise<
    | [
        {
          message: string;
          data: {
            success: boolean;
          };
          statusCode: number;
        },
        null
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        }
      ]
  > {
    const createdWorkflowDefinitionResult = await asyncHandler(
      WorkflowDefinition.create([
        {
          name: definitionData.workflowData.name,
          description: definitionData.workflowData.description,
          global: definitionData.workflowData.global,
          status: definitionData.workflowData.status,
          tasks: definitionData.workflowData.tasks,
          ...(definitionData?.ui && {
            uiObject: {
              [definitionData.key]: definitionData.ui,
            },
          }),
        },
      ])
    );

    if (!createdWorkflowDefinitionResult.success) {
      this.logChild.error(`Workflow Definition create failed`);
      this.logChild.error(createdWorkflowDefinitionResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Workflow Definition create failed`,
          statusCode: 500,
        },
      ];
    }

    return [
      {
        message: "Workflow Definition created successfully",
        statusCode: 201,
        data: { success: !!createdWorkflowDefinitionResult.result },
      },
      null,
    ];
  }
}
