FROM node:14.15.0

WORKDIR /app

COPY . /app

RUN npm install --loglevel=error
RUN npm run build

CMD [ "npm", "run", "serve" ]