import { fromGemtext } from 'dioscuri';
import { Root } from 'dioscuri/lib/from-gemtext.js';
import { Heading } from 'dioscuri/lib/gast.js';
import mustache from 'mustache';
import slug from 'slug';
import { OkRequestResolution } from '../resolvers/RequestResolution.js';
import { GEMINI_HTML_MAP } from './GeminiHtmlMap.js';
import pageTemplate from './page-template.js';

for (const key in GEMINI_HTML_MAP) {
  mustache.parse(GEMINI_HTML_MAP[key]);
}

export function transformGeminiStringToHtml(
  geminiResponse: OkRequestResolution,
) {
  const tree = fromGemtext(geminiResponse.body);
  const titleToken = (tree.children || []).find(
    (token): token is Heading => token.type === 'heading' && token.rank === 1,
  );
  const title = !!titleToken ? titleToken.value : '';

  return Buffer.from(
    mustache.render(pageTemplate, {
      lang: geminiResponse.lang,
      title,
      bodyContent: transformGeminiTreeToHtml(tree),
      url: (process.env.GEMINI_ROOT_URL || '') + geminiResponse.url,
    }),
  );
}

export function transformGeminiTreeToHtml(tree: Root) {
  return (tree.children || [])
    .map((item) => {
      const line = { ...item, slug: '' };
      switch (line.type) {
        case 'heading':
          if (line.rank) line.slug = slug(line.value);
          break;
        case 'pre':
          if (line.alt) line.type += ':alt';
          break;
        case 'link':
          if (line.url?.startsWith('http')) line.type += ':http';
          else line.type += ':gemini';
          if (line.url && !line.value) {
            line.value = line.url;
          }
          break;
        default:
      }
      const template = GEMINI_HTML_MAP[line.type];
      if (!template) return '';
      return mustache.render(template, line);
    })
    .join('\n');
}
