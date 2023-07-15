import winston from "winston";
import morgan from "morgan";

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    enumerateErrorFormat(),
    process.env.NODE_ENV !== "production"
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

const stream = {
  // Use the http severity
  write: (message: any) => logger.http(message),
};

const skip = () => false;
// const env = process.env.NODE_ENV || 'development';
// return env !== 'development';

export const morganMiddleware = morgan(
  // Define message format string (this is the default one).
  // The message format is made from tokens, and each token is
  // defined inside the Morgan library.
  // You can create your custom token to show what do you want from a request.
  process.env.NODE_ENV === "development"
    ? "dev"
    : ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  // Options: in this case, I overwrote the stream and the skip logic.
  // See the methods above.
  { stream, skip }
);

export default logger;
