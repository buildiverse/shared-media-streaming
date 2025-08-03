FROM ghcr.io/buildiverse/containers:base-v0.1.1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]