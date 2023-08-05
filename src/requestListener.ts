import crypto from 'node:crypto';
import http from 'node:http';
import { HttpException } from './http/HttpException.js';
import { HttpStatusCode } from './http/HttpStatusCode.js';
import triggerError from './triggerError.js';
import { transformGeminiStringToHtml } from './views/GeminiHtmlTransformer.js';

if (!process.env.GEMINI_ROOT_URL) {
  throw new Error('GEMINI_ROOT_URL is not defined');
}
const GEMINI_ROOT_URL = new URL(process.env.GEMINI_ROOT_URL).toString();

const resolve = (
  await import(
    process.env.CONTENT_PATH ? './resolvers/local.js' : './resolvers/remote.js'
  )
).default;

export const requestListener: http.RequestListener<
  typeof http.IncomingMessage,
  typeof http.ServerResponse
> = async function handler(req, res) {
  if (!req.url) throw new Error('Missing url in request object');
  console.info('%s %s', req.method, req.url);
  try {
    const geminiResponse = await resolve(req.url);

    if (
      geminiResponse.statusCode === HttpStatusCode.MOVED_PERMANENTLY ||
      geminiResponse.statusCode === HttpStatusCode.MOVED_TEMPORARILY
    ) {
      res.writeHead(geminiResponse.statusCode, 'Moved Temporarily', {
        Location: geminiResponse.redirectUrl,
      });
      res.end();
      return;
    }

    if (geminiResponse.statusCode !== HttpStatusCode.OK) {
      throw new HttpException(
        HttpStatusCode.NOT_IMPLEMENTED,
        `Status code ${geminiResponse.statusCode} is not implemented`,
      );
    }

    let { contentType, body: output } = geminiResponse;

    if (contentType.includes('text/gemini')) {
      // transform gemini to html
      output = transformGeminiStringToHtml(geminiResponse);
      contentType = 'text/html';
    }

    const md5Hasher = crypto.createHmac('md5', GEMINI_ROOT_URL);
    const etag = md5Hasher.update(output).digest('hex');

    const ifNoneMatchHead = req.headers['if-none-match'];
    if (ifNoneMatchHead && ifNoneMatchHead === etag) {
      res.writeHead(304, 'Not Modified', {
        ETag: `"${etag}"`,
      });
      res.end();
      return;
    }

    res.writeHead(200, 'OK', {
      ETag: `"${etag}"`,
      'Content-Type': contentType,
    });

    res.end(output);
  } catch (error) {
    if (error instanceof HttpException) {
      triggerError(res, error.statusCode, error.message);
      return;
    }
    console.error(error);
    triggerError(
      res,
      500,
      process.env.DEBUG ? JSON.stringify(error) : 'Internal Error',
    );
  }
};
