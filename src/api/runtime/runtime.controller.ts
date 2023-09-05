import type { Request, Response } from "express";
import type { RuntimeService } from "./runtime.service";

export class RuntimeController {
  private runtimeService: RuntimeService;

  constructor(runtimeService: RuntimeService) {
    this.runtimeService = runtimeService;
  }

  public async getRuntimeDetail(req: Request<{ id: string }>, res: Response) {
    const [data, error] = await this.runtimeService.getRuntimeDetail(req.params.id);

    if (error) {
      return res.status(error?.statusCode).json(error);
    }

    return res.status(data?.statusCode).json(data);
  }
}
