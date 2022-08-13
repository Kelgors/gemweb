# Gemweb

HTTP server that serves and transpile gemini files to html made in nodejs.

If you give CONTENT_PATH variable, it will serve files this directory.
If you don't give CONTENT_PATH, it will serve content from GEMINI_ROOT_URL.

## Install

```
# install dependencies
yarn
# launch file server
GEMINI_ROOT_URL=gemini://kelgors.me CONTENT_PATH=path/to/your/gemini/directory HTML_TEMPLATE=path/to/template.html CONTENT_LANG=en yarn start
# launch proxy server
GEMINI_ROOT_URL=gemini://kelgors.me HTML_TEMPLATE=./example/template.html yarn start
```

## Environment Variables

- PORT: port used by the http server (default: 3000, 80 for Docker)
- HTML_TEMPLATE: Path to .html file used for templating (mandatory)
- CONTENT_PATH: Path of Gemini files (required for file serving)
- GEMINI_ROOT_URL: The url of your gemini capsule (required for gemini proxying)
- CONTENT_LANG: html language code (default: "en" or use language given by gemini server)
