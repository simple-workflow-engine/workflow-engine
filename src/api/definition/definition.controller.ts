import type { Request, Response } from "express";
import type { DefinitionService } from "./definition.service";

export class DefinitionController {
  definitionService: DefinitionService;

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
}
