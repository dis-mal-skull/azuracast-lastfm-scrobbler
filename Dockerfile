FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
