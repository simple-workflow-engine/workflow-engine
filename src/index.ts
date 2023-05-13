import WorkflowRouter from "@/api/workflow/workflow.router";
import { EnvironmentVariables } from "./env/index";
import cors from "cors";
import { config } from "dotenv";
import type { Express } from "express";
import express from "express";
import { connect } from "mongoose";
import morgan from "morgan";
import "reflect-metadata";

const envVarsObj = EnvironmentVariables.getInstance();
const EnvVars = envVarsObj.EnvVars;

config();

let app: Express;

const PORT = Number(EnvVars.PORT || 8001);
const HOST = EnvVars.HOST || "127.0.0.1";

async function bootstrap() {
  app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cors());
  app.use(morgan("dev"));

  app.use("/workflow", WorkflowRouter);

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
      console.info("MongoDB connected successfully");
      app.listen(PORT, HOST, () => {
        console.info(`Server Started on http://${HOST}:${PORT}`);
      });
    })
    .catch((error) => {
      console.info("MongoDB connection failed");
      console.error(error);
    });
}

bootstrap().catch((error) => {
  console.error(error);
});

export { app };
