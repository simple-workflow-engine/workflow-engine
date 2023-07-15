import type { Request, Response } from "express";
import { WorkflowService } from "./workflow.service";
import { asyncHandler } from "@/lib/utils/asyncHandler";

const workflowService = new WorkflowService();

export class WorkflowController {
  private static instance: WorkflowController;

  static getInstance(): WorkflowController {
    if (!WorkflowController.instance) {
      WorkflowController.instance = new WorkflowController();
    }
    return WorkflowController.instance;
  }

  private constructor() {}

  async startWorkflow(req: Request, res: Response) {
    const [data, error] = await workflowService.startWorkflow();
    if (error) {
      return res.status(error?.statusCode).json(error);
    }
    return res.status(data?.statusCode).json(data);
  }
}
