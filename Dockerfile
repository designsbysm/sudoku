FROM node:16.13.1-alpine

ENV PATH /app/node_modules/.bin:$PATH
WORKDIR /app

ARG FONTAWESOME_NPM_TOKEN
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $FONTAWESOME_NPM_TOKEN

COPY ./package.json package.json
RUN npm install --silent
RUN npm install serve --silent

COPY . .
RUN npm run build

CMD ["serve", "-s", "build"]