// @source {https://github.com/RangerMauve/gemini-to-html/blob/master/render.js}
// with small tweaks on links
const { htmlEscape } = require('escape-goat');
const slug = require('slug');

function id(content) {
  return slug(content, {
    replacement: '_'
  });
}

function render (tokens) {
  return tokens.map((line) => {
    const { type } = line;

    switch (type) {
      case 'quote': 
        return htmlEscape`<blockquote>${line.content}</blockquote>`;
      case 'header': 
        return htmlEscape`<h${line.level} id="${id(line.content)}">${line.content}</h${line.level}>`;
      case 'link':
        if (line.href.startsWith('http')) {
            return htmlEscape`<div><a target="_blank" rel="noopener noreferrer" href="${line.href}">${line.content}</a></div>`;    
        }
        return htmlEscape`<div><a href="${line.href}">${line.content}</a></div>`;
      case 'pre': return line.alt
        ? htmlEscape`<pre><code class="language-${line.alt}">\n${line.items.join('\n')}\n</code></pre>`
        : htmlEscape`<pre>\n${line.items.join('\n')}\n</pre>`;
      case 'list': 
        return `<ul>\n${line.items.map((item) => htmlEscape`\t<li>${item}</li>`).join('\n')}\n</ul>`;
      default: 
        return line.content ? htmlEscape`<p>${line.content}</p>` : '<br/>';
    }
  }).join('\n')
}

module.exports = render;