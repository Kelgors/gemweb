import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mime from 'mime';
import Mustache from 'mustache';
import { fromGemtext } from 'dioscuri';
import renderToHTML from './render.js';
import template from './template.js';
import triggerError from './triggerError.js';

if (!process.env.CONTENT_PATH) {
  console.error('Missing ROOT path to gemini files');
  process.exit(1);
}

const rootPath = process.env.CONTENT_PATH;

export default async function resolveFile(req, res) {
  console.info('%s %s', req.method, req.url);
  try {
    let filepath = path.join(rootPath, req.url);
    let stat;
    // check file
    try {
      stat = await fs.stat(filepath);
    } catch (err) {
      triggerError(res, 404, `Not Found ${req.url}`);
      return;
    }
    if (stat.isDirectory()) {
      try {
        // check with index.gmi
        filepath = path.join(filepath, 'index.gmi');
        stat = await fs.stat(filepath);
      } catch (err) {
        triggerError(res, 404, `Not Found ${req.url}`);
        return;
      }
    }
    if (!stat.isFile()) {
      triggerError(res, 404, `Not Found ${req.url}`);
      return;
    }

    let output = await fs.readFile(filepath);
    let contentType = mime.getType(filepath);
    if (filepath.endsWith('.gmi')) {
      const tree = fromGemtext(output);
      const titleToken = tree.children.find(({ type, rank }) => type === 'heading' && rank === 1);
      const title = !!titleToken ? titleToken.value : '';
      output = Buffer.from(
        Mustache.render(template, {
          lang: process.env.CONTENT_LANG || 'en',
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
    triggerError(res, 500, 'Internal Error');
  }
}
