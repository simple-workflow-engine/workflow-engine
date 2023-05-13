import { Router } from "express";
import { WorkflowController } from "./workflow.controller";

const workflowController = WorkflowController.getInstance();

const WorkflowRouter = Router();

WorkflowRouter.get("/", workflowController.startWorkflow);

export default WorkflowRouter;
