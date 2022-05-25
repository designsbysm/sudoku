FROM node:16.15.0-alpine

RUN npm install -g serve

ARG FONTAWESOME_NPM_TOKEN
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $FONTAWESOME_NPM_TOKEN

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

CMD serve --single build