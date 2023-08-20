import type { Request, Response } from "express";

import type { ProcessWorkflowBody, StartWorkflowBody } from "./workflow.dto";
import { type WorkflowService } from "./workflow.service";

export class WorkflowController {
  private workflowService: WorkflowService;

  constructor(workflowService: WorkflowService) {
    this.workflowService = workflowService;
  }

  async startWorkflow(req: Request, res: Response) {
    const body: StartWorkflowBody = req.body;
    const [data, error] = await this.workflowService.startWorkflow(body.workflowDefinitionId, body.globalParams);
    if (error) {
      return res.status(error?.statusCode).json(error);
    }
    return res.status(data?.statusCode).json(data);
  }

  async processWorkflow(req: Request, res: Response) {
    const body: ProcessWorkflowBody = req.body;
    const [data, error] = await this.workflowService.processWorkflow(body.workflowRuntimeId, body.taskName);
    if (error) {
      return res.status(error?.statusCode).json(error);
    }
    return res.status(data?.statusCode).json(data);
  }
}
