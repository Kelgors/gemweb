FROM node:18-alpine as builder
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable &&\
    rm -r .yarn
COPY src src

FROM node:18-alpine as runner
ENV NODE_ENV=production
ENV PORT=80
ENV HTML_TEMPLATE=/usr/local/template.html
EXPOSE 80
WORKDIR /app
COPY --from=builder /app /app
CMD ["node", "src/index.js"]
