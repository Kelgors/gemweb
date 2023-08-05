FROM node:18-alpine as builder
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn .yarn
RUN yarn install --immutable --immutable-cache --check-cache
COPY src src
RUN yarn build
RUN yarn workspaces focus --all --production
RUN yarn cache clean
RUN rm -r src tsconfig.json

FROM node:18-alpine as runner
RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=80
ENV HTML_TEMPLATE=/usr/local/template.html
EXPOSE 80
WORKDIR /app
COPY --from=builder /app /app
HEALTHCHECK CMD curl -sf http://127.0.0.1 > /dev/null && exit 0 || exit 1
CMD ["yarn", "start"]
