declare namespace Express {
  export interface User {
    iss: string;
    sub: string;
    aud: string[];
    iat: number;
    exp: number;
    azp: string;
    scope: string;
  }

  export interface Request {
    user?: User;
  }
}
