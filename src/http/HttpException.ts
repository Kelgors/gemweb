import { HttpStatusCode } from './HttpStatusCode.js';

export class HttpException {
  constructor(public statusCode: HttpStatusCode, public message: string) {}
}
