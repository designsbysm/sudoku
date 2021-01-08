FROM node:14.15.3-alpine3.12

WORKDIR /app

COPY . /app

RUN npm install --loglevel=error
RUN npm run build

CMD [ "npm", "run", "serve" ]