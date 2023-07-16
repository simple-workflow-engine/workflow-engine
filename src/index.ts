import "reflect-metadata";
import WorkflowRouter from "@/api/workflow/workflow.router";
import { EnvironmentVariables } from "./env/index";
import cors from "cors";
import { config } from "dotenv";
import type { Express } from "express";
import express from "express";
import { connect } from "mongoose";
import logger, { morganMiddleware } from "./lib/utils/logger";

const envVarsObj = EnvironmentVariables.getInstance();
const EnvVars = envVarsObj.EnvVars;

config();

let app: Express;

const PORT = Number(EnvVars.PORT || 8001);

async function bootstrap() {
  app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cors());

  app.use(morganMiddleware);

  app.use("/workflow", WorkflowRouter);

  app.get("/health", (req, res) =>
    res.status(200).json({
      message: "Workfllow Engine Health up",
      status: {
        up: true,
        serverTime: new Date().toJSON(),
      },
    })
  );

  connect(
    [
      "mongodb+srv://",
      encodeURIComponent(EnvVars.MONGO_USER),
      ":",
      encodeURIComponent(EnvVars.MONGO_PASS),
      "@",
      EnvVars.MONGO_CLUSTER,
      "/",
      EnvVars.MONGO_DB,
      "?retryWrites=true&w=majority",
    ].join("")
  )
    .then(() => {
      logger.info("MongoDB connected successfully");
      app.listen(PORT, () => {
        logger.info(`Server Started on ${PORT}`);
      });
    })
    .catch((error) => {
      logger.info("MongoDB connection failed");
      logger.error(error);
    });
}

bootstrap().catch((error) => {
  logger.error(error);
});

export { app };
