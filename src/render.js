import slug from 'slug';

function renderHTML(tree) {
  return (tree.children || []).map((line) => {
    switch (line.type) {
      case 'quote': 
        return `<blockquote>${line.value}</blockquote>`;
      case 'heading': 
        return `<h${line.rank} id="${slug(line.value)}">${line.value}</h${line.rank}>`;
      case 'link':
        if (line.url.startsWith('http')) {
          return `<div><a target="_blank" rel="noopener noreferrer" href="${line.url}">${line.value || line.url}</a></div>`;    
        }
        return `<div><a href="${line.url}">${line.value || line.url}</a></div>`;
      case 'pre': return line.alt
        ? `<pre><code class="language-${line.alt}">\n${line.value}\n</code></pre>`
        : `<pre>\n${line.value}\n</pre>`;
      case 'list': 
        return `<ul>\n${line.children.map((item) => `\t<li>${item.value}</li>`).join('\n')}\n</ul>`;
      case 'text':
        return `<p>${line.value}</p>`;
      case 'break':
        return '<br/>';
      default: 
        return '';
    }
  }).join('\n')
}

export default function render(tree) {
  return renderHTML(tree);
};