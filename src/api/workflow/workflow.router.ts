import { Router } from "express";
import { WorkflowController } from "./workflow.controller";
import { BodyValidator } from "@/lib/utils/bodyValidator";
import { ProcessWorkflowBody, StartWorkflowBody } from "./workflow.dto";

const workflowController = WorkflowController.getInstance();

const WorkflowRouter = Router();

WorkflowRouter.post("/start", BodyValidator(StartWorkflowBody), workflowController.startWorkflow);
WorkflowRouter.post("/process", BodyValidator(ProcessWorkflowBody), workflowController.processWorkflow);

export default WorkflowRouter;
