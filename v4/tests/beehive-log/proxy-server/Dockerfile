FROM node:current-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install
COPY main.js .
CMD [ "node", "main.js" ]