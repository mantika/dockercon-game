FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production
COPY index.js /usr/src/app
COPY public /usr/src/app/public
COPY red /usr/src/app/red
COPY green /usr/src/app/green

CMD [ "npm", "start" ]
