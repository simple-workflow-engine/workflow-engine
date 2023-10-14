FROM node:18.12.0

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn run build

EXPOSE 8080

CMD ["yarn","run", "start:prod"]