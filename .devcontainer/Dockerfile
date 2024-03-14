#FROM node:18
FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

ARG USERNAME=node
ENV HOME /home/$USERNAME

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm@8; \
    pnpm config set store-dir .pnpm-store

RUN curl -fsSL https://bun.sh/install | bash

RUN chown -R $USERNAME:$USERNAME $HOME

# [Optional] Add sudo support
#RUN apt-get install -y sudo \
#    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME && \
#    chmod 0440 /etc/sudoers.d/$USERNAME

RUN apt-get install -y git procps

# Copy default endpoint specific user settings overrides into container to specify Formatter
#COPY --chown=node:node settings.vscode.json $HOME/.vscode-remote/data/Machine/settings.json
#ENV NODE_OPTIONS --max-old-space-size=8192
ENV HOST 0.0.0.0
# [Optional] Set the default user
#USER $USERNAME