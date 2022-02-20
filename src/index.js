const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const mime = require('mime');
const Mustache = require('mustache');
const parseGemini = require('gemini-to-html/parse');
const renderToHTML = require('./render.js');

if (!process.env.ROOT) {
    console.error('Missing ROOT path to gemini files');
    process.exit(1);
}
if (!process.env.HTML_TEMPLATE) {
    console.error('Missing HTML_TEMPLATE path to the html template');
    process.exit(1);
}

const rootPath = process.env.ROOT;
const templateContent = require('fs').readFileSync(process.env.HTML_TEMPLATE).toString();
console.log('Parsing template');
Mustache.parse(templateContent);

function triggerError(res, code, message) {
    console.error('Error %s %s', code, message);
    res.statusCode = code;
    res.statusMessage = message;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write(message);
    res.end();
}

const server = http.createServer(async function (req, res) {
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
        const tokens = parseGemini(fileContent.toString());
        const titleToken = tokens.find(({ type, level }) => type === 'header' && level === 1);
        const title = !!titleToken ? titleToken.content : '';

        const htmlOutput = Mustache.render(templateContent, {
            lang: process.env.LANG || 'en',
            title,
            bodyContent: renderToHTML(tokens),
            url: (process.env.GEMINI_ROOT_URL || '') + req.url
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.write(htmlOutput);
        res.end();
    } catch (err) {
        console.error(err);
        triggerError(res, 500, 'Internal Error');
    }
});

server.listen(process.env.PORT || '3000', function () {
    console.info('Server started on port %s', process.env.PORT || '3000');
});
