FROM node:14.17.6-alpine

ARG npm_token
ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app
COPY . ./

RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" $npm_token

RUN npm install -g npm
RUN npm install --silent
RUN npm run build

CMD ["npm", "run", "serve"]