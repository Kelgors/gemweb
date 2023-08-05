import { HttpStatusCode } from '../http/HttpStatusCode.js';

export type RequestResolution = RedirectRequestResolution | OkRequestResolution;
export type OkRequestResolution = {
  statusCode: HttpStatusCode.OK;
  url: string;
  body: Buffer;
  contentType: string;
  lang: string;
};
export type RedirectRequestResolution = {
  statusCode:
    | HttpStatusCode.MOVED_PERMANENTLY
    | HttpStatusCode.MOVED_TEMPORARILY;
  redirectUrl: string;
};
