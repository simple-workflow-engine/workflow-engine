import { Router, type Request } from "express";
import { DefinitionController } from "./definition.controller";
import { DefinitionService } from "./definition.service";
import { authRequired } from "@/lib/utils/authValidator";
import { BodyValidator } from "@/lib/utils/bodyValidator";
import { AddWorkflowBody, EditWorkflowBody } from "./definition.dto";

const definitionService = new DefinitionService();
const definitionController = new DefinitionController(definitionService);

const DefinitionRouter = Router();

DefinitionRouter.get("/", authRequired, (req, res) => definitionController.getWorkflows(req, res));
DefinitionRouter.post("/add-workflow", authRequired, BodyValidator(AddWorkflowBody), (req, res) =>
  definitionController.addWorkflow(req, res)
);
DefinitionRouter.put(
  "/edit-workflow/:id",
  authRequired,
  BodyValidator(EditWorkflowBody),
  (req: Request<{ id: string }>, res) => definitionController.editWorkflow(req, res)
);
DefinitionRouter.get("/:id", authRequired, (req: Request<{ id: string }>, res) =>
  definitionController.getWorkflowDetail(req, res)
);
DefinitionRouter.get("/single/:id", authRequired, (req: Request<{ id: string }>, res) =>
  definitionController.getSingleWorkflow(req, res)
);

export default DefinitionRouter;
