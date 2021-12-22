FROM node:16.13.1-alpine

ENV PATH /app/node_modules/.bin:$PATH
WORKDIR /app

ARG npm_token
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $npm_token

COPY ./package.json package.json
RUN npm install --silent
RUN npm install serve --silent

COPY . .
RUN npm run build

CMD ["serve", "-s", "build"]