# gemini-html-server:1.2.0
FROM node:16-alpine
ENV NODE_ENV=production
ENV PORT=8080
ENV HTML_TEMPLATE=/usr/local/template.html
EXPOSE 8080
WORKDIR /app
COPY . .
RUN yarn

CMD ["yarn", "start"]
