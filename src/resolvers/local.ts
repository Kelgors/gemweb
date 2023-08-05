import mime from 'mime';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpException } from '../http/HttpException.js';
import { HttpStatusCode } from '../http/HttpStatusCode.js';
import { RequestResolution } from './RequestResolution.js';

mime.define({ 'text/gemini': ['gmi', 'gemini'] });

const IS_SERVING_HIDDEN_FILE_ALLOWED = process.env.SERVE_HIDDEN === '1';
if (!process.env.CONTENT_PATH) {
  throw new Error('CONTENT_PATH is not defined');
}
const CONTENT_PATH = path.resolve(process.env.CONTENT_PATH);

export default async function resolveFile(
  url: string,
): Promise<RequestResolution> {
  // Check if requested file is hidden
  const basename = path.basename(url);
  if (basename.startsWith('.') && !IS_SERVING_HIDDEN_FILE_ALLOWED) {
    throw new HttpException(
      HttpStatusCode.FORBIDDEN,
      'You cannot access hidden files',
    );
  }
  // Resolve file path
  let filepath = path.resolve(path.join(CONTENT_PATH, url));
  if (!filepath.startsWith(CONTENT_PATH)) {
    throw new HttpException(
      HttpStatusCode.FORBIDDEN,
      'You cannot use relative URLs',
    );
  }
  // check file presence
  let stat;
  try {
    stat = await fs.stat(filepath);
  } catch {
    throw new HttpException(HttpStatusCode.NOT_FOUND, 'Not Found');
  }

  if (stat.isDirectory()) {
    // ensure trailing slash for directories
    if (!url.endsWith('/')) {
      return {
        statusCode: HttpStatusCode.MOVED_PERMANENTLY,
        redirectUrl: url + '/',
      };
    }
    try {
      // check directory/index.gmi presence
      filepath = path.join(filepath, 'index.gmi');
      stat = await fs.stat(filepath);
    } catch (err) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, 'Not Found');
    }
  }
  if (!stat.isFile()) {
    throw new HttpException(HttpStatusCode.NOT_FOUND, 'Not Found');
  }

  return {
    statusCode: HttpStatusCode.OK,
    url,
    body: await fs.readFile(filepath),
    contentType: mime.getType(filepath) || 'text/plain',
    lang: process.env.CONTENT_LANG || 'en',
  };
}
