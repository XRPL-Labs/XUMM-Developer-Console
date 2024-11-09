FROM node:14
WORKDIR /home/node/app
RUN apt update && apt install -y python2 git
COPY . .
RUN npm install
ENV $(cat .env | xargs)
EXPOSE 8080
CMD ["npm", "run", "serve"]

