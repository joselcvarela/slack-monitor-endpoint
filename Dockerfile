FROM node:18-alpine

RUN npm i -g pnpm

WORKDIR /app
COPY package.json .
RUN pnpm i

COPY index.js .
CMD pnpm run start
