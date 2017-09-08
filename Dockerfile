FROM node:9

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    google-chrome-stable ocaml libelf-dev git-core zsh fonts-powerline locales && \ 
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh | bash && \
    git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

RUN mkdir -p /home/node/app
WORKDIR /home/node/app

ENV TERM xterm-256color
COPY ./docker/.zshrc /root/.zshrc
COPY ./docker/custom/pure.zsh-theme /root/.oh-my-zsh/custom/pure.zsh-theme
RUN sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && \
    locale-gen

COPY package.json /home/node/app
COPY yarn.lock /home/node/app
RUN yarn install --no-optional

COPY ./docker/docker /usr/local/bin/docker
COPY ./docker/docker-compose /usr/local/bin/docker-compose

RUN chmod +x /usr/local/bin/docker-compose

RUN touch /var/run/docker.sock && \
    chmod -R 775 /var/run/docker.sock

COPY . /home/node/app
COPY . /app
RUN find /app -name node_modules -type d -exec rm -rf {} +

EXPOSE 8000

ENTRYPOINT /usr/bin/zsh

CMD yarn start
