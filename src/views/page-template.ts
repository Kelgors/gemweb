import mustache from 'mustache';
import fs from 'node:fs/promises';

if (!process.env.HTML_TEMPLATE) {
  throw new Error('HTML_TEMPLATE is not defined');
}
const templateContent = (await fs.readFile(process.env.HTML_TEMPLATE)).toString(
  'utf-8',
);
console.info('Parsing template: %s', process.env.HTML_TEMPLATE);
mustache.parse(templateContent);
export default templateContent;
