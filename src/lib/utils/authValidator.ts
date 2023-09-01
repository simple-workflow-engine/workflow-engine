import { EnvironmentVariables } from "@/env";
import { auth } from "express-oauth2-jwt-bearer";

const envVars = EnvironmentVariables.getInstance().EnvVars;

export const authRequired = auth({
  audience: envVars.AUTH0_IDENTIFIER,
  issuerBaseURL: envVars.AUTH0_ISSUER,
});
