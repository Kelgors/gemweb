FROM node:16-alpine
ENV NODE_ENV=production
ENV PORT=80
ENV HTML_TEMPLATE=/usr/local/template.html
EXPOSE 80
WORKDIR /app
COPY . .
RUN yarn

CMD ["yarn", "start"]
