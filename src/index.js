import http from 'node:http';
import handler from './handler.js';

if (!process.env.HTML_TEMPLATE) {
  console.error('Missing HTML_TEMPLATE path to the html template');
  process.exit(1);
}
const PORT = process.env.PORT || '3000';

const server = http.createServer(handler);

server.listen(PORT, function () {
  console.info('Server started on port %s', PORT);
});
