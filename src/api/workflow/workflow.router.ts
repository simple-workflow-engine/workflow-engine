import { Router } from "express";
import { WorkflowController } from "./workflow.controller";
import { BodyValidator } from "@/lib/utils/bodyValidator";
import { ProcessWorkflowBody, StartWorkflowBody } from "./workflow.dto";
import { WorkflowService } from "./workflow.service";
import { authRequired } from "@/lib/utils/authValidator";

const workflowService = new WorkflowService();
const workflowController = new WorkflowController(workflowService);

const WorkflowRouter = Router();

WorkflowRouter.post("/start", authRequired, BodyValidator(StartWorkflowBody), (req, res) =>
  workflowController.startWorkflow(req, res)
);
WorkflowRouter.post("/process", authRequired, BodyValidator(ProcessWorkflowBody), (req, res) =>
  workflowController.processWorkflow(req, res)
);

export default WorkflowRouter;
