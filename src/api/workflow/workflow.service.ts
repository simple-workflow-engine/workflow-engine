import { Processor } from "@/engine/processor";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import { WorkflowDefinition, WorkflowRuntime } from "@/models";

export class WorkflowService {
  private logChild = logger.child({
    name: WorkflowService.name,
  });

  constructor() {}

  async startWorkflow(
    workflowDefinitionId: string,
    globalParams?: Record<string, any>
  ): Promise<
    | [
        {
          message: string;
          data: Record<string, any>;
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
    const [workflowDefinitionData, workflowDefinitionDataError] = await asyncHandler(
      WorkflowDefinition.findById(workflowDefinitionId)
    );

    if (workflowDefinitionDataError) {
      this.logChild.error(`WorkflowDefinition findById failed for ${workflowDefinitionId}`);
      this.logChild.error(workflowDefinitionDataError);

      return [
        null,
        {
          message: "Internal Server Error",
          statusCode: 500,
          error: `WorkflowDefinition findById failed for ${workflowDefinitionId}`,
        },
      ];
    }

    if (!workflowDefinitionData) {
      return [
        null,
        {
          message: "Bad Request",
          statusCode: 400,
          error: `Invalid WorkflowDefinition Id: ${workflowDefinitionId}`,
        },
      ];
    }

    const [workflowRuntimeData, workflowRuntimeDataError] = await asyncHandler(
      WorkflowRuntime.create({
        workflowDefinitionId: workflowDefinitionData?._id,
        workflowStatus: "pending",
        workflowResults: {},
        tasks: workflowDefinitionData?.tasks,
        global: {
          ...(workflowDefinitionData?.global && { ...workflowDefinitionData?.global }),
          ...(globalParams && { ...globalParams }),
        },
        logs: [],
      })
    );

    if (workflowRuntimeDataError) {
      this.logChild.error(`WorkflowRuntime create failed for ${workflowDefinitionId}`);
      this.logChild.error(workflowRuntimeDataError);
      return [
        null,
        {
          statusCode: 500,
          message: "Internal Server Error",
          error: `WorkflowRuntime create failed for ${workflowDefinitionId}`,
        },
      ];
    }

    if (!workflowRuntimeData) {
      return [
        null,
        {
          message: "Bad Request",
          statusCode: 400,
          error: `Can not create WorkflowRuntime for ${workflowDefinitionId}`,
        },
      ];
    }

    const processor = new Processor(workflowRuntimeData._id.toString(), "START");

    return processor.processTask();
  }

  async processWorkflow(workflowRuntimeId: string, taskName: string) {
    const processor = new Processor(workflowRuntimeId, taskName);
    return processor.processTask();
  }
}
