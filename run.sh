#!/bin/bash

# docker run -p 8080:8080 --rm -it --name node14 -v $(pwd):/home/node/app node:14 sh -c 'apt update ; apt install python2 git ; cd /home/node/app; npm install ; npm run serve'

docker build -t node14-devconsole .
docker run -p 8080:8080 --rm -it --name node14-devconsole node14-devconsole


