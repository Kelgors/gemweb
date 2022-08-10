import tls from 'node:tls';
import Mustache from 'mustache';
import { fromGemtext } from 'dioscuri';
import crypto from 'node:crypto';

import renderToHTML from './render.js';
import template from './template.js';
import triggerError from './triggerError.js';

function fetch(url) {
  return new Promise(function (resolve, reject) {
    try {
      const uri = new URL(url);
      const socket = tls.connect(
        {
          port: 1965,
          host: uri.host,
          servername: uri.host,
          enableTrace: process.env.DEBUG === '1',
          rejectUnauthorized: false,
          checkServerIdentity: () => {
            return null;
          }
        },
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          let isErrored = false;
          const chunks = [];
          socket.write(`${url}\r\n`, 'utf-8');
          socket.once('error', function (err) {
            if (isErrored) return;
            isErrored = true;
            reject(err);
          });
          socket.on('data', function (data) {
            if (isErrored) return;
            chunks.push(data);
          });
          socket.once('end', function () {
            if (isErrored) return;
            const buffer = Buffer.concat(chunks);
            let headerEnd = -1;
            for (let index = 0; index < buffer.length; index++) {
              if (buffer.at(index) === 13 && buffer.at(index + 1) == 10) {
                headerEnd = index + 2;
                break;
              }
            }
            const header = buffer.slice(0, headerEnd - 2).toString('utf-8');
            resolve({
              statusCode: header.slice(0, 2),
              statusMessage: header.slice(3),
              body: buffer.slice(headerEnd, buffer.length)
            });
          });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export default async function resolveFile(req, res) {
  console.info('%s %s', req.method, req.url);
  try {
    console.info('- Proxy(to: %s)', process.env.GEMINI_ROOT_URL + req.url);

    const response = await fetch(process.env.GEMINI_ROOT_URL + req.url);

    console.info('- Response(status: %s, message: %s)', response.statusCode, response.statusMessage);

    let contentType = response.statusMessage.split(';')[0];
    let lang = /;lang=(.*)/.exec(response.statusMessage);
    let output = response.body;

    if (contentType.includes('text/gemini')) {
      const tree = fromGemtext(response.body);
      const titleToken = (tree.children || []).find(({ type, rank }) => type === 'heading' && rank === 1);
      const title = !!titleToken ? titleToken.value : '';

      output = Buffer.from(
        Mustache.render(template, {
          lang: process.env.CONTENT_LANG || lang[1] || 'en',
          title,
          bodyContent: renderToHTML(tree),
          url: (process.env.GEMINI_ROOT_URL || '') + req.url
        })
      );
      contentType = 'text/html';
    }

    const md5Hasher = crypto.createHmac('md5', process.env.GEMINI_ROOT_URL);
    const etag = md5Hasher.update(output).digest('hex');

    const ifNoneMatchHead = req.headers['if-none-match'];
    if (ifNoneMatchHead && ifNoneMatchHead === etag) {
      res.writeHead(304, 'Not Modified', {
        ETag: etag
      });
      res.end();
      return;
    }

    res.writeHead(200, 'OK', {
      ETag: etag,
      'Content-Type': contentType
    });

    res.end(output);
  } catch (err) {
    console.error(err);
    triggerError(res, 500, process.env.DEBUG ? String(err) : 'Internal Error');
  }
}
