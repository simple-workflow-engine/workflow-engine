import axios from "axios";

export class Utilities {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async createTicket(params: { name: string; assignee: string }) {
    console.log(params.name);
    console.log(params.assignee);
  }

  public async removeTicket(params: { name: string; assignee: string }) {
    console.log(params.name);
    console.log(params.assignee);
  }

  public async sendNotification(params: { name: string; email: string; payload: string }) {
    console.log(params.name);
    console.log(params.email);
    console.log(params.payload);
  }

  public async apiCall(params: {
    url: string;
    payload?: { [key: string]: any };
    headers: { [key: string]: any };
    method:
      | "get"
      | "GET"
      | "delete"
      | "DELETE"
      | "head"
      | "HEAD"
      | "options"
      | "OPTIONS"
      | "post"
      | "POST"
      | "put"
      | "PUT"
      | "patch"
      | "PATCH"
      | "purge"
      | "PURGE"
      | "link"
      | "LINK"
      | "unlink"
      | "UNLINK";
    queryParams?: { [key: string]: any };
  }) {
    return axios({
      method: params.method,
      url: params.url,
      ...(params?.payload && { data: params.payload }),
      headers: params.headers,
      ...(params?.queryParams && {
        params: params.queryParams,
      }),
    });
  }
}
