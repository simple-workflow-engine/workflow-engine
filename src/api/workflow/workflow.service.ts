import { Processor } from "@/engine/processor";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import { WorkflowRuntime } from "@/models";

export class WorkflowService {
  constructor() {}

  async startWorkflow(): Promise<
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
    const [] = await asyncHandler(WorkflowRuntime);

    const processor = new Processor();

    return processor.processTask();
  }
}
