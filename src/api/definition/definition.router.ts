import { Router } from "express";
import { DefinitionController } from "./definition.controller";
import { DefinitionService } from "./definition.service";
import { authRequired } from "@/lib/utils/authValidator";

const definitionService = new DefinitionService();
const definitionController = new DefinitionController(definitionService);

const DefinitionRouter = Router();

DefinitionRouter.get("/", authRequired, (req, res) => definitionController.getWorkflows(req, res));

export default DefinitionRouter;
