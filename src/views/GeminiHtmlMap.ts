export const GEMINI_HTML_MAP: Record<string, string> = {
  quote: '<blockquote>{{ value }}</blockquote>',
  heading: '<h{{ rank }} id="{{ slug }}">{{ value }}</h{{ rank }}>',
  'link:http':
    '<div><a target="_blank" rel="noopener noreferrer" href="{{ url }}">{{ value }}</a></div>',
  'link:gemini': '<div><a href="{{ url }}">{{ value }}</a></div>',
  pre: '<pre>\n{{ value }}\n</pre>',
  'pre:alt':
    '<pre><code class="language-{{ alt }}">\n{{ value }}\n</code></pre>',
  list: '<ul>{{#children}}<li>{{ value }}</li>{{/children}}</ul>',
  text: '<p>{{ value }}</p>',
  break: '<br/>',
};
