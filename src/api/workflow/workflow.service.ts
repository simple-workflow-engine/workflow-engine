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
    const workflowDefinitionDataResult = await asyncHandler(WorkflowDefinition.findById(workflowDefinitionId));

    if (!workflowDefinitionDataResult.success) {
      this.logChild.error(`WorkflowDefinition findById failed for ${workflowDefinitionId}`);
      this.logChild.error(workflowDefinitionDataResult.error);

      return [
        null,
        {
          message: "Internal Server Error",
          statusCode: 500,
          error: `WorkflowDefinition findById failed for ${workflowDefinitionId}`,
        },
      ];
    }

    if (!workflowDefinitionDataResult.result) {
      return [
        null,
        {
          message: "Bad Request",
          statusCode: 400,
          error: `Invalid WorkflowDefinition Id: ${workflowDefinitionId}`,
        },
      ];
    }

    const workflowRuntimeDataResult = await asyncHandler(
      WorkflowRuntime.create({
        workflowDefinitionId: workflowDefinitionDataResult.result?._id,
        workflowStatus: "pending",
        workflowResults: {},
        tasks: workflowDefinitionDataResult.result?.tasks?.map((t) => ({ ...t, status: "pending" })),
        global: {
          ...(workflowDefinitionDataResult.result?.global && { ...workflowDefinitionDataResult.result?.global }),
          ...(globalParams && { ...globalParams }),
        },
        logs: [],
      })
    );

    if (!workflowRuntimeDataResult.success) {
      this.logChild.error(`WorkflowRuntime create failed for ${workflowDefinitionId}`);
      this.logChild.error(workflowRuntimeDataResult.error);
      return [
        null,
        {
          statusCode: 500,
          message: "Internal Server Error",
          error: `WorkflowRuntime create failed for ${workflowDefinitionId}`,
        },
      ];
    }

    if (!workflowRuntimeDataResult.result) {
      return [
        null,
        {
          message: "Bad Request",
          statusCode: 400,
          error: `Can not create WorkflowRuntime for ${workflowDefinitionId}`,
        },
      ];
    }
    const startTaskName = workflowRuntimeDataResult.result.tasks.find((val) => val.type === "START")?.name;

    if (!startTaskName) {
      return [
        null,
        {
          message: "Bad Request",
          statusCode: 400,
          error: `Can not find START task of WorkflowRuntime ${workflowDefinitionId}`,
        },
      ];
    }

    const processor = new Processor(workflowRuntimeDataResult.result._id.toString(), startTaskName);

    const processTaskResult = await asyncHandler(processor.processTask());

    if (!processTaskResult.success) {
      this.logChild.error(
        `Process Task failed for Workflow Runtime: ${workflowRuntimeDataResult.result._id.toString()} and Task Name: ${startTaskName}`
      );
      this.logChild.error(processTaskResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Process Task failed for Workflow Runtime: ${workflowRuntimeDataResult.result._id.toString()} and Task Name: ${startTaskName}`,
          statusCode: 500,
        },
      ];
    }

    return processTaskResult.result;
  }

  async processWorkflow(
    workflowRuntimeId: string,
    taskName: string
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
    const processor = new Processor(workflowRuntimeId, taskName);

    const processTaskResult = await asyncHandler(processor.processTask());

    if (!processTaskResult.success) {
      this.logChild.error(`Process Task failed for Workflow Runtime: ${workflowRuntimeId} and Task Name: ${taskName}`);
      this.logChild.error(processTaskResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Process Task failed for Workflow Runtime: ${workflowRuntimeId} and Task Name: ${taskName}`,
          statusCode: 500,
        },
      ];
    }

    return processTaskResult.result;
  }
}
