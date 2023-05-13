export const ErrorCodes = {
  WF100: "Database connection error",
  WF101: "Server Error",
} as const;

export class ErrorTransformer {
  statusCode: number;
  message: string;
  error: string;
  errorCode: keyof typeof ErrorCodes;
  reason: string;
  stackTrace: any;

  constructor(
    statusCode: number,
    message: string,
    error: string,
    errorCode: keyof typeof ErrorCodes,
    reason: string,
    stackTrace: any
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.errorCode = errorCode;
    this.reason = reason;
    this.stackTrace = stackTrace;
  }

  get json() {
    return {
      json: {
        message: this.message,
        error: this.error,
        errorCode: this.errorCode,
        reason: this.reason,
        ...(process?.env?.DEBUG === "1" && {
          stackTrace: this.stackTrace,
        }),
      },
      statusCode: this.statusCode,
    };
  }

  get text() {
    return {
      text: JSON.stringify({
        message: this.message,
        error: this.error,
        errorCode: this.errorCode,
        reason: this.reason,
        ...(process?.env?.DEBUG === "1" && {
          stackTrace: this.stackTrace,
        }),
      }),
      statusCode: this.statusCode,
    };
  }
}
