FROM node:14-alpine

WORKDIR /app

ENV NODE_ENV=production


COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

CMD [ "node", "server.js" ]