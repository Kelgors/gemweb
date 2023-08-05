import crypto from 'node:crypto';
import resolveFile from './resolvers/file.js';
import resolveRemote from './resolvers/gemini.js';
import triggerError from './triggerError.js';
import { transformGeminiStringToHtml } from './views/gemini-html.js';

const resolve = !!process.env.GEMINI_ROOT_URL && !process.env.CONTENT_PATH ? resolveRemote : resolveFile;

export default async function handler(req, res) {
  console.info('%s %s', req.method, req.url);
  try {
    const geminiResponse = await resolve(req.url);

    if (geminiResponse && geminiResponse.type === 'redirect') {
      res.writeHead(302, 'Moved Temporarily', {
        Location: geminiResponse.redirectUrl
      });
      res.end();
      return;
    }

    if (!geminiResponse || !geminiResponse.body) {
      triggerError(res, 404, 'Not Found');
      return;
    }

    let { contentType, body: output } = geminiResponse;

    if (contentType.includes('text/gemini')) {
      // transform gemini to html
      output = transformGeminiStringToHtml(geminiResponse);
      contentType = 'text/html';
    }

    const md5Hasher = crypto.createHmac('md5', process.env.GEMINI_ROOT_URL);
    const etag = md5Hasher.update(output).digest('hex');

    const ifNoneMatchHead = req.headers['if-none-match'];
    if (ifNoneMatchHead && ifNoneMatchHead === etag) {
      res.writeHead(304, 'Not Modified', {
        ETag: `"${etag}"`
      });
      res.end();
      return;
    }

    res.writeHead(200, 'OK', {
      ETag: `"${etag}"`,
      'Content-Type': contentType
    });

    res.end(output);
  } catch (err) {
    console.error(err);
    triggerError(res, 500, process.env.DEBUG ? String(err) : 'Internal Error');
  }
}
