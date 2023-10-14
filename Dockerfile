# FROM ubuntu:latest

# USER root

# WORKDIR /app

# COPY . .

# RUN apt-get update

# RUN apt-get install -y curl gnupg python3 g++ build-essential ca-certificates

# RUN mkdir -p /etc/apt/keyrings

# RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# RUN apt-get update

# # RUN curl -s https://deb.nodesource.com/setup_18.x | bash -

# RUN apt-get -y install nodejs

# RUN npm i -g yarn

# RUN yarn global add node-gyp

# RUN yarn install

# RUN yarn build

# EXPOSE 8080

# CMD ["yarn", "start:prod"]

FROM node:18.12.0

COPY . . 

RUN yarn install

RUN yarn build

EXPOSE 8080

CMD ["yarn", "start:prod"]