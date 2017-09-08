FROM node:9-alpine

RUN apk add --no-cache make gcc g++ python wget

RUN adduser node root && \
	mkdir -p /home/node/app && \
	mkdir -p /.config && \
	mkdir -p /.cache

WORKDIR /home/node/app

COPY package.json yarn.* /home/node/app/

RUN yarn install --no-optional

COPY . /home/node/app

RUN	chmod -R 775 /.config && chown -R node:root /.config && \
	chmod -R 775 /.cache && chown -R node:root /.cache && \
 	chmod -R 775 /home/node/app && chown -R node:root /home/node/app && \
	chgrp -R 0 /home/node/ && chmod -R g+srwX /home/node/

ENV SELENIUM_HOST localhost
ENV SELENIUM_PORT 4444

ENTRYPOINT ["sh", "./entrypoint.sh"]
