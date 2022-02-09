# Gemini HTML Server

HTTP server that serves and transpile gemini files to html made in nodejs.

## Install

```
# install dependencies
npm ci
# launch server
PORT=8080 ROOT=absolute/path/to/your/gemini/directory HTML_TEMPLATE=absolute/path/to/template.html LANG=en npm start
```

## Environment Variables

* PORT: port used by the http server (default: 3000)
* ROOT: Path of Gemini files (mandatory)
* HTML_TEMPLATE: Path to .html file used for templating (mandatory)
* LANG: html language code (default: en)
* GEMINI_ROOT_URL: The url of your gemini capsule
