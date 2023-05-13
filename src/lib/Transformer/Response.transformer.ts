export class ResponseTransformer<T = unknown> {
  statusCode: number;
  message: string;
  data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  get json() {
    return {
      json: {
        message: this.message,
        data: this.data,
      },
      statusCode: this.statusCode,
    };
  }

  get text() {
    return {
      text: JSON.stringify({
        message: this.message,
        data: this.data,
      }),
      statusCode: this.statusCode,
    };
  }
}
