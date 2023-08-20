import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import type { WorkflowDefinitionDocument } from "@/models";
import { WorkflowDefinition } from "@/models";

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
    const [workflowDefinitions, workflowDefinitionsError] = await asyncHandler(
      WorkflowDefinition.find<WorkflowDefinitionDocument>()
    );

    if (workflowDefinitionsError) {
      this.logChild.error(`WorkflowDefinition find failed`);
      this.logChild.error(workflowDefinitionsError);

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
        data: workflowDefinitions ?? [],
      },
      null,
    ];
  }
}
