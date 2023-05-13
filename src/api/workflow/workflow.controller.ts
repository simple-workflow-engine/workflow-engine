import type { Request, Response } from "express";
import { WorkflowService } from "./workflow.service";

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
    const data = await workflowService.startWorkflow();

    if (req.headers?.accept?.includes("application/json")) {
      const resBody = data.json;
      return res.status(resBody.statusCode).json(resBody.json);
    } else {
      const resBody = data.text;
      return res.status(resBody.statusCode).send(resBody.text);
    }
  }
}
