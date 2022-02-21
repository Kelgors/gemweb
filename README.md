# Gemini HTML Server

HTTP server that serves and transpile gemini files to html made in nodejs.

The file server works, the proxy server works with some servers.

## Install

```
# install dependencies
npm ci
# launch file server
PORT=8080 GEMINI_ROOT_URL=gemini://kelgors.me ROOT=absolute/path/to/your/gemini/directory HTML_TEMPLATE=absolute/path/to/template.html LANG=en npm start
# launch proxy server
PORT=8080 GEMINI_ROOT_URL=gemini://kelgors.me HTML_TEMPLATE=./example/template.html LANG=en npm start
```

## Environment Variables

* PORT: port used by the http server (default: 3000)
* ROOT: Path of Gemini files (required for file server)
* HTML_TEMPLATE: Path to .html file used for templating (mandatory)
* LANG: html language code (default: en)
* GEMINI_ROOT_URL: The url of your gemini capsule
