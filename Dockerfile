FROM node:20-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml .env.development .env.production ./

RUN npm install -g pnpm

RUN npm install pm2 -g

RUN pnpm install --frozen-lockfile

RUN pm2 install pm2-logrotate

RUN pm2 set pm2-logrotate:max_size 10M
RUN pm2 set pm2-logrotate:retain 5
RUN pm2 set pm2-logrotate:compress true

COPY . .

EXPOSE 4000
