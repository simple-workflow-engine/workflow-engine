import { ErrorTransformer } from "@/lib/Transformer/Error.transformer";
import { ResponseTransformer } from "@/lib/Transformer/Response.transformer";

export class WorkflowService {
  constructor() {}

  async startWorkflow() {
    try {
      const data = {};
      return new ResponseTransformer(
        200,
        "Workflow started successfully",
        data
      );
    } catch (error) {
      console.error(error);
      return new ErrorTransformer(
        500,
        "Internal Server Error",
        "Something went wrong",
        "WF101",
        "Because of something",
        error
      );
    }
  }
}
