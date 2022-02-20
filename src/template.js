import fs from 'node:fs';
import Mustache from 'mustache';

const templateContent = fs.readFileSync(process.env.HTML_TEMPLATE).toString();
console.info('Parsing template');
Mustache.parse(templateContent);
export default templateContent;