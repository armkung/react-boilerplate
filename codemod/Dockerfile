FROM node:9-alpine

RUN apk add --no-cache make

RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY package.json /home/node/app
COPY yarn.lock /home/node/app
RUN yarn install --no-optional

COPY . /home/node/app