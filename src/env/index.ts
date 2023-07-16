import { z } from "zod";
import { config } from "dotenv";

config();

const envSchema = z.object({
  PORT: z.string(),
  MONGO_USER: z.string(),
  MONGO_PASS: z.string(),
  MONGO_CLUSTER: z.string(),
  MONGO_DB: z.string(),
  DEPLOYED_URL: z.string(),
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
