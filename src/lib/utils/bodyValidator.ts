import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

import logger from "./logger";

export const BodyValidator = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  if (!body) {
    return res.status(400).json({
      message: "Bad Request",
      error: "No Body Found",
    });
  }

  try {
    schema.parse(body);
    return next();
  } catch (error) {
    logger.error(`Body Validator failed`);
    logger.error(error);
    logger.info("Body");
    logger.info(body);

    return res.status(400).json({
      message: "Bad Request",
      error: error,
    });
  }
};
