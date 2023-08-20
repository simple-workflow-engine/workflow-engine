import { Router } from "express";
import { DefinitionController } from "./definition.controller";
import { DefinitionService } from "./definition.service";

const definitionService = new DefinitionService();
const definitionController = new DefinitionController(definitionService);

const DefinitionRouter = Router();

DefinitionRouter.get("/", (req, res) => definitionController.getWorkflows(req, res));

export default DefinitionRouter;
