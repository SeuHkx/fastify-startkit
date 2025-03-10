FROM node:20-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml .env.development .env.production ./

RUN npm install -g pnpm

RUN npm install pm2 -g

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4000
