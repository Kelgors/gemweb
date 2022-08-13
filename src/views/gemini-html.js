import { fromGemtext } from 'dioscuri';
import mustache from 'mustache';
import slug from 'slug';
import pageTemplate from './page-template.js';
import HTML_MAPPER from './html-mapper.json' assert { type: 'json' };

for (let key in HTML_MAPPER) {
  mustache.parse(HTML_MAPPER[key]);
}

export function transformGeminiStringToHtml(geminiResponse) {
  const tree = fromGemtext(geminiResponse.body);
  const titleToken = (tree.children || []).find(({ type, rank }) => type === 'heading' && rank === 1);
  const title = !!titleToken ? titleToken.value : '';

  return Buffer.from(
    mustache.render(pageTemplate, {
      lang: geminiResponse.lang,
      title,
      bodyContent: transformGeminiTreeToHtml(tree),
      url: (process.env.GEMINI_ROOT_URL || '') + geminiResponse.url
    })
  );
}

export function transformGeminiTreeToHtml(tree) {
  return (tree.children || [])
    .map((item) => {
      const line = { ...item };
      switch (line.type) {
        case 'heading':
          if (line.rank) line.slug = slug(line.value);
          break;
        case 'pre':
          if (line.alt) line.type += ':alt';
          break;
        case 'link':
          if (line.url.startsWith('http')) line.type += ':http';
          else line.type += ':gemini';
          if (line.url && !line.value) {
            line.value = line.url;
          }
          break;
        default:
      }
      const template = HTML_MAPPER[line.type];
      if (!template) return '';
      return mustache.render(template, line);
    })
    .join('\n');
}
