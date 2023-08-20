import { Router } from "express";
import { WorkflowController } from "./workflow.controller";
import { BodyValidator } from "@/lib/utils/bodyValidator";
import { ProcessWorkflowBody, StartWorkflowBody } from "./workflow.dto";
import { WorkflowService } from "./workflow.service";

const workflowService = new WorkflowService();
const workflowController = new WorkflowController(workflowService);

const WorkflowRouter = Router();

WorkflowRouter.post("/start", BodyValidator(StartWorkflowBody), (req, res) =>
  workflowController.startWorkflow(req, res)
);
WorkflowRouter.post("/process", BodyValidator(ProcessWorkflowBody), (req, res) =>
  workflowController.processWorkflow(req, res)
);

export default WorkflowRouter;
