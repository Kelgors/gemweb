const http = require('http');

if (!process.env.ROOT) {
    console.error('Missing ROOT path to gemini files');
    process.exit(1);
}
if (!process.env.HTML_TEMPLATE) {
    console.error('Missing HTML_TEMPLATE path to the html template');
    process.exit(1);
}

const server = http.createServer(require('./resolve-file.js'));

server.listen(process.env.PORT || '3000', function () {
    console.info('Server started on port %s', process.env.PORT || '3000');
});
