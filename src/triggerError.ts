import http from 'node:http';
import { HttpStatusCode } from './http/HttpStatusCode.js';

export default function triggerError(
  res: InstanceType<typeof http.ServerResponse> & {
    req: InstanceType<typeof http.IncomingMessage>;
  },
  code: HttpStatusCode,
  message: string,
) {
  console.error('[ERROR] %s %s', code, message);
  res.writeHead(code, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(message);
}
