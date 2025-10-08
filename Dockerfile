FROM ubuntu:latest
ARG NODE_VERSION=14

# install curl
RUN apt update && apt install curl -y

# install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# set env
ENV NVM_DIR=/root/.nvm

# install node
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION"

# set ENTRYPOINT for reloading nvm-environment
ENTRYPOINT ["bash", "-c", "source $NVM_DIR/nvm.sh && exec \"$@\"", "--"]

RUN cd
COPY . .
RUN [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npm install
ENV $(cat .env | xargs)
EXPOSE 8080
CMD ["bash", "-c", "source $NVM_DIR/nvm.sh && exec \"$@\"", "--", "npm", "run", "serve"]

