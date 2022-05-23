FROM node:16.15.0-alpine

WORKDIR /app

ARG FONTAWESOME_NPM_TOKEN
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $FONTAWESOME_NPM_TOKEN

COPY package.json .

RUN npm install -g serve
RUN npm install

COPY . .
RUN npm run build

CMD serve --single build