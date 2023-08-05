FROM node:18-alpine as builder
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable && \
    rm -r .yarn
COPY src src

FROM node:18-alpine as runner
RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=80
ENV HTML_TEMPLATE=/usr/local/template.html
EXPOSE 80
WORKDIR /app
COPY --from=builder /app /app
HEALTHCHECK CMD curl -sf http://127.0.0.1 > /dev/null && exit 0 || exit 1
CMD ["node", "src/index.js"]
