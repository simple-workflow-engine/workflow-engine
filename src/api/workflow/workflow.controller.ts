import type { Request, Response } from "express";
import { WorkflowService } from "./workflow.service";
import type { ProcessWorkflowBody, StartWorkflowBody } from "./workflow.dto";

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
    const body: StartWorkflowBody = req.body;
    const [data, error] = await workflowService.startWorkflow(body.workflowDefinitionId, body.globalParams);
    if (error) {
      return res.status(error?.statusCode).json(error);
    }
    return res.status(data?.statusCode).json(data);
  }

  async processWorkflow(req: Request, res: Response) {
    const body: ProcessWorkflowBody = req.body;
    const [data, error] = await workflowService.processWorkflow(body.workflowRuntimeId, body.taskName);
    if (error) {
      return res.status(error?.statusCode).json(error);
    }
    return res.status(data?.statusCode).json(data);
  }
}
