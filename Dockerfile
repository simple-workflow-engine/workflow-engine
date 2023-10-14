FROM node:18.12.0

COPY . . 

RUN yarn install

RUN yarn build

EXPOSE 8080

CMD ["yarn", "start:prod"]