import { z } from "zod";
import { config } from "dotenv";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).optional(),
  PORT: z.string(),
  MONGO_USER: z.string(),
  MONGO_PASS: z.string(),
  MONGO_CLUSTER: z.string(),
  MONGO_DB: z.string(),
  DEPLOYED_URL: z.string(),
  MONGO_DEV_URI: z.string().optional(),
  AUTH0_IDENTIFIER: z.string(),
  AUTH0_ISSUER: z.string(),
});

export type EnvVars = z.infer<typeof envSchema>;

export class EnvironmentVariables {
  envVars: EnvVars;
  static instance: EnvironmentVariables;

  private constructor() {
    this.envVars = envSchema.parse(process.env);
  }
  static getInstance(): EnvironmentVariables {
    if (!EnvironmentVariables.instance) {
      EnvironmentVariables.instance = new EnvironmentVariables();
    }
    return EnvironmentVariables.instance;
  }

  get EnvVars(): EnvVars {
    return this.envVars;
  }
}
