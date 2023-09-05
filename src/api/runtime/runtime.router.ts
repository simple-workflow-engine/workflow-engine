import type { Request } from "express";
import { Router } from "express";
import { RuntimeController } from "./runtime.controller";
import { RuntimeService } from "./runtime.service";
import { authRequired } from "@/lib/utils/authValidator";

const runtimeService = new RuntimeService();
const runtimeController = new RuntimeController(runtimeService);

const RuntimeRouter = Router();

RuntimeRouter.get("/:id", authRequired, (req: Request<{ id: string }>, res) =>
  runtimeController.getRuntimeDetail(req, res)
);

export default RuntimeRouter;
