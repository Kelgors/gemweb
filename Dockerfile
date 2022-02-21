# gemini-html-server:1.0.1
FROM node:16-alpine
ENV NODE_ENV production
ENV PORT 8080
ENV HTML_TEMPLATE /usr/local/template.html
ENV LANG en
EXPOSE 8080
WORKDIR /app

COPY package* ./
RUN npm ci
COPY src/ src/

CMD ["npm", "start"]