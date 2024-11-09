#!/bin/bash

# docker run -p 8080:8080 --rm -it --name node14 -v $(pwd):/home/node/app node:14 sh -c 'apt update ; apt install python2 git ; cd /home/node/app; npm install ; npm run serve'

docker rmi node14-devconsole
docker build --no-cache -t node14-devconsole .
docker run -p 8080:8080 --rm -it --name node14-devconsole -v $(pwd):/home/node/app node14-devconsole sh -c 'cd /home/node/app; . /home/node/app/.env && npm run build && npm run serve'


