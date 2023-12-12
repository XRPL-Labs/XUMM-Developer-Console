FROM node:14
WORKDIR /home/node/app
RUN apt update && apt install -y python2 git
COPY . .
RUN npm install
EXPOSE 8080
CMD ["npm", "run", "serve"]

