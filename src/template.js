const templateContent = require('fs').readFileSync(process.env.HTML_TEMPLATE).toString();
console.log('Parsing template');
require('mustache').parse(templateContent);
module.exports = templateContent;