import fs from 'node:fs';
import mustache from 'mustache';

const templateContent = fs.readFileSync(process.env.HTML_TEMPLATE).toString();
console.info('Parsing template: %s', process.env.HTML_TEMPLATE);
mustache.parse(templateContent);
export default templateContent;
