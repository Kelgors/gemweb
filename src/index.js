const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const parseGemini = require('gemini-to-html/parse');
const renderToHTML = require('./render.js');
const Mustache = require('mustache');

if (!process.env.ROOT) {
    console.error('Missing ROOT path to gemini files');
    process.exit(1);
}
if (!process.env.HTML_TEMPLATE) {
    console.error('Missing HTML_TEMPLATE path to the html template');
    process.exit(1);
}

const app = express();
const rootPath = process.env.ROOT;
const templateContent = require('fs').readFileSync(process.env.HTML_TEMPLATE).toString();
console.log('Parsing template');
Mustache.parse(templateContent);

function triggerError(res, code, message) {
    console.error('Error %s %s', code, message);
    res.status(404).end(message);
}

app.use(async function (req, res) {
    console.info(`${req.method} ${req.path}`);
    try {
        let filepath = path.join(rootPath, req.path);
        let stat;
        // check file
        try {
            stat = await fs.stat(filepath);
        } catch (err) {
            triggerError(res, 404, `not found ${req.path}`);
            return;
        }
        if (stat.isDirectory()) {
            // check with index.gmi
            filepath = path.join(filepath, 'index.gmi');
            stat = await fs.stat(filepath);
        }
        if (!stat.isFile()) {
            triggerError(res, 404, `not found ${req.path}`);
            return;
        }
        if (!filepath.endsWith('.gmi')) {
            console.trace('sendFile(%s)', filepath);
            res.sendFile(filepath);
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
            url: path.join(process.env.GEMINI_ROOT_URL || '', req.path)
        });
        res.end(htmlOutput);
    } catch (err) {
        console.error(err);
    }
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Server started on port %d', process.env.PORT);
});