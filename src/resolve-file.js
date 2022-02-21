import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mime from 'mime';
import Mustache from 'mustache';
import { fromGemtext } from 'dioscuri';
import renderToHTML from './render.js';
import template from './template.js';
import triggerError from './triggerError.js';

if (!process.env.ROOT) {
    console.error('Missing ROOT path to gemini files');
    process.exit(1);
}

const rootPath = process.env.ROOT;

export default async function resolveFile(req, res) {
    console.info('%s %s', req.method, req.url);
    try {
        let filepath = path.join(rootPath, req.url);
        let stat;
        // check file
        try {
            stat = await fs.stat(filepath);
        } catch (err) {
            triggerError(res, 404, `not found ${req.url}`);
            return;
        }
        if (stat.isDirectory()) {
            try {
                // check with index.gmi
                filepath = path.join(filepath, 'index.gmi');
                stat = await fs.stat(filepath);
            } catch (err) {
                triggerError(res, 404, `not found ${req.url}`);
                return;
            }
        }
        if (!stat.isFile()) {
            triggerError(res, 404, `not found ${req.url}`);
            return;
        }
        if (!filepath.endsWith('.gmi')) {
            const buffer = await fs.readFile(filepath);
            res.setHeader('Content-Type', mime.getType(filepath) || 'text/plain; charset=utf-8');
            res.write(buffer);
            res.end();
            return;
        }
        // render .gmi
        const fileContent = await fs.readFile(filepath);
        const tree = fromGemtext(fileContent);
        const titleToken = tree.children.find(({ type, rank }) => type === 'heading' && rank === 1);
        const title = !!titleToken ? titleToken.value : '';

        const md5Hasher = crypto.createHmac('md5', process.env.GEMINI_ROOT_URL);
        const etag = md5Hasher.update(fileContent).digest('hex');

        const ifNoneMatchHead = req.headers['if-none-match'];
        if (ifNoneMatchHead && ifNoneMatchHead === etag) {
            res.writeHead(304, 'Not Modified', {
                ETag: `W/${etag}`,
            });
            res.end();
            return;
        }

        const htmlOutput = Mustache.render(template, {
            lang: process.env.LANG || 'en',
            title,
            bodyContent: renderToHTML(tree),
            url: (process.env.GEMINI_ROOT_URL || '') + req.url
        });
        res.writeHead(200, '', {
            'ETag': `W/${etag}`,
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write(htmlOutput);
        res.end();
    } catch (err) {
        console.error(err);
        triggerError(res, 500, 'Internal Error');
    }
};
