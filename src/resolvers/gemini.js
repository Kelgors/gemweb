import tls from 'node:tls';

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

export default async function resolveFile(url) {
  console.info('- Proxy(to: %s)', process.env.GEMINI_ROOT_URL + url);
  const response = await fetch(process.env.GEMINI_ROOT_URL + url);
  console.info('- Response(status: %s, message: %s)', response.statusCode, response.statusMessage);

  const contentType = response.statusMessage.split(';')[0];
  const lang = /;lang=(.*)/.exec(response.statusMessage) || [];

  if (response.statusCode === '31') {
    return {
      type: 'redirect',
      url,
      redirectUrl: contentType.replace(process.env.GEMINI_ROOT_URL, ''),
      lang: process.env.CONTENT_LANG || lang[1] || 'en'
    };
  }

  return {
    type: 'file',
    url,
    body: response.body,
    contentType,
    lang: process.env.CONTENT_LANG || lang[1] || 'en'
  };
}
