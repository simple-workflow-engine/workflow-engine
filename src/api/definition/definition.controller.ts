import type { Request, Response } from "express";
import type { DefinitionService } from "./definition.service";
import type { AddWorkflowBody, EditWorkflowBody } from "./definition.dto";

export class DefinitionController {
  private definitionService: DefinitionService;

  constructor(definitionService: DefinitionService) {
    this.definitionService = definitionService;
  }

  public async getWorkflows(req: Request, res: Response) {
    const [data, error] = await this.definitionService.getWorkflows();

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }

  public async addWorkflow(req: Request<{}, any, AddWorkflowBody>, res: Response) {
    const [data, error] = await this.definitionService.addWorkflow(req.body);

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }

  public async editWorkflow(req: Request<{ id: string }, any, EditWorkflowBody>, res: Response) {
    const [data, error] = await this.definitionService.editWorkflow(req.params.id, req.body);

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }

  public async getSingleWorkflow(req: Request<{ id: string }>, res: Response) {
    const [data, error] = await this.definitionService.getSingleWorkflow(req.params.id);

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }

  public async getWorkflowDetail(req: Request<{ id: string }>, res: Response) {
    const [data, error] = await this.definitionService.getWorkflowDetail(req.params.id);

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }
}
