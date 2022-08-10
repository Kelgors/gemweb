export default function triggerError(res, code, message) {
  console.error('Error %s %s', code, message);
  res.statusCode = code;
  res.statusMessage = message;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(message);
  res.end();
}
