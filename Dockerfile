# gemini-html-server:2-node16-slim
FROM node:16-bullseye-slim
ENV NODE_ENV production
ENV PORT 8080
ENV ROOT /usr/local/www-data
ENV HTML_TEMPLATE /usr/local/template.html
ENV LANG en
WORKDIR /server
RUN apt update && apt install -y wget unzip \
    && wget -q https://github.com/Kelgors/gemini-html-server/archive/refs/heads/main.zip \
    && unzip main.zip && rm main.zip \
    && cd gemini-html-server-main \
    && npm ci
WORKDIR /server/gemini-html-server-main
EXPOSE 8080
CMD ["npm", "start"]