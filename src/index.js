import http from 'node:http';

if (!process.env.HTML_TEMPLATE) {
  console.error('Missing HTML_TEMPLATE path to the html template');
  process.exit(1);
}

const { default: resolve } = await import(
  !!process.env.GEMINI_ROOT_URL && !process.env.CONTENT_PATH ? './resolve-gemini.js' : './resolve-file.js'
);

const server = http.createServer(resolve);

server.listen(process.env.PORT || '3000', function () {
  console.info('Server started on port %s', process.env.PORT || '3000');
});
