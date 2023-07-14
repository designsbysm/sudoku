FROM node:18.16.1-alpine

RUN npm install -g http-server

ARG FONTAWESOME_NPM_TOKEN
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $FONTAWESOME_NPM_TOKEN

WORKDIR /app

COPY package.json .
RUN yarn install

COPY . .
RUN yarn build

CMD http-server build
