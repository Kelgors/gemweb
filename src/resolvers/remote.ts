import tls from 'node:tls';
import { GeminiStatusCode } from '../gemini/GeminiStatusCode.js';
import { HttpException } from '../http/HttpException.js';
import { HttpStatusCode } from '../http/HttpStatusCode.js';
import { RequestResolution } from './RequestResolution.js';

type FetchResponse = {
  statusCode: GeminiStatusCode;
  statusMessage: string;
  body: Buffer;
};

if (!process.env.GEMINI_ROOT_URL) {
  throw new Error('GEMINI_ROOT_URL is not defined');
}
const GEMINI_ROOT_URL = new URL(process.env.GEMINI_ROOT_URL).toString();

const GEMINI_STATUS_MAP: Partial<Record<GeminiStatusCode, HttpStatusCode>> = {
  [GeminiStatusCode.INPUT]: HttpStatusCode.NOT_IMPLEMENTED,
  [GeminiStatusCode.SENSITIVE_INPUT]: HttpStatusCode.NOT_IMPLEMENTED,
  [GeminiStatusCode.SERVER_UNAVAILABLE]: HttpStatusCode.NOT_AVAILABLE,
  [GeminiStatusCode.CGI_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [GeminiStatusCode.PERMANENT_FAILURE]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [GeminiStatusCode.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [GeminiStatusCode.GONE]: HttpStatusCode.GONE,
  [GeminiStatusCode.BAD_REQUEST]: HttpStatusCode.BAD_REQUEST,
  [GeminiStatusCode.CLIENT_CERTIFICATE_REQUIRED]:
    HttpStatusCode.INTERNAL_SERVER_ERROR,
  [GeminiStatusCode.CERTIFICATE_NOT_AUTHORIZED]:
    HttpStatusCode.INTERNAL_SERVER_ERROR,
  [GeminiStatusCode.CERTIFICATE_NOT_VALID]:
    HttpStatusCode.INTERNAL_SERVER_ERROR,
};

export default async function resolveRemote(
  url: string,
): Promise<RequestResolution> {
  console.info(`[PROXY][REQUEST] ${url}`);
  const response = await fetch(GEMINI_ROOT_URL + url);
  console.info(
    `[PROXY][RESPONSE] status: ${response.statusCode}, message: ${response.statusMessage}`,
  );

  const contentType = response.statusMessage.split(';')[0];
  const lang = /;lang=(.*)/.exec(response.statusMessage) || [];

  if (
    response.statusCode === GeminiStatusCode.REDIRECT_PERMANENT ||
    response.statusCode === GeminiStatusCode.REDIRECT_TEMPORARY
  ) {
    return {
      statusCode:
        response.statusCode === GeminiStatusCode.REDIRECT_PERMANENT
          ? HttpStatusCode.MOVED_TEMPORARILY
          : HttpStatusCode.MOVED_PERMANENTLY,
      redirectUrl: contentType.replace(GEMINI_ROOT_URL, ''),
    };
  }

  if (response.statusCode in GEMINI_STATUS_MAP) {
    const quickGeminiHttpCodeMapping = GEMINI_STATUS_MAP[response.statusCode];
    if (!quickGeminiHttpCodeMapping) {
      throw new Error(
        `Missing mapping for Gemini status code ${response.statusCode}`,
      );
    }
    throw new HttpException(
      quickGeminiHttpCodeMapping,
      HttpStatusCode[quickGeminiHttpCodeMapping],
    );
  }

  return {
    statusCode: HttpStatusCode.OK,
    url,
    body: response.body,
    contentType,
    lang: process.env.CONTENT_LANG || lang[1] || 'en',
  };
}

function fetch(url: string): Promise<FetchResponse> {
  return new Promise(function (resolve, reject) {
    try {
      const uri = new URL(url);
      const uriPort = uri.port ? parseInt(uri.port, 10) : 1965;
      const socket = tls.connect(
        {
          port: uriPort,
          host: uri.host,
          servername: uri.host,
          enableTrace: process.env.DEBUG === '1',
          rejectUnauthorized: false,
          checkServerIdentity: () => {
            return undefined;
          },
        },
        () => {
          let isErrored = false;
          const chunks: Buffer[] = [];
          socket.write(`${url}\r\n`, 'utf-8');
          socket.once('error', function (err) {
            if (isErrored) return;
            isErrored = true;
            reject(err);
          });
          socket.on('data', function (data: Buffer) {
            if (isErrored) return;
            chunks.push(data);
          });
          socket.once('end', function () {
            if (isErrored) return;
            const buffer = Buffer.concat(chunks);
            let headerEnd = -1;
            for (let index = 0; index < buffer.length; index++) {
              if (buffer.at(index) === 13 && buffer.at(index + 1) === 10) {
                headerEnd = index + 2;
                break;
              }
            }
            const header = buffer.subarray(0, headerEnd - 2).toString('utf-8');
            const parsedStatusCode = parseInt(header.slice(0, 2), 10);
            resolve({
              statusCode: parsedStatusCode,
              statusMessage: header.slice(3),
              body: buffer.subarray(headerEnd, buffer.length),
            });
          });
        },
      );
    } catch (err) {
      reject(err);
    }
  });
}
