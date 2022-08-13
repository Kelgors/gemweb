import fs from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime';

mime.define({ 'text/gemini': ['gmi', 'gemini'] });

const isServingHiddenFileAllowed = process.env.SERVE_HIDDEN === '1';

export default async function resolveFile(url) {
  const basename = path.basename(url);
  if (basename.startsWith('.') && !isServingHiddenFileAllowed) {
    return null;
  }
  let filepath = path.join(process.env.CONTENT_PATH, url);
  let stat;
  // check file
  try {
    stat = await fs.stat(filepath);
  } catch (err) {
    return null;
  }
  if (stat.isDirectory()) {
    try {
      // check with index.gmi
      filepath = path.join(filepath, 'index.gmi');
      stat = await fs.stat(filepath);
    } catch (err) {
      return null;
    }
  }
  if (!stat.isFile()) {
    return null;
  }

  return {
    url,
    body: await fs.readFile(filepath),
    contentType: mime.getType(filepath) || 'text/plain',
    lang: process.env.CONTENT_LANG || 'en'
  };
}