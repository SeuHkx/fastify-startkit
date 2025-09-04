########## build stage ##########
FROM node:20-slim AS builder

WORKDIR /workspace

# deps
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile

# source
COPY . .

# build (TS -> dist, templates -> public/dist, then webpack -> app)
RUN pnpm webpack

########## runtime stage ##########
FROM node:20-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# lightweight runtime deps: pnpm + pm2-runtime (+logrotate config)
RUN npm i -g pnpm pm2 \
 && pm2 install pm2-logrotate \
 && pm2 set pm2-logrotate:max_size 10M \
 && pm2 set pm2-logrotate:retain 5 \
 && pm2 set pm2-logrotate:compress true

# copy built app
COPY --from=builder /workspace/app /app

EXPOSE 4000

# use pm2-runtime in container
CMD ["pm2-runtime", "bin/ecosystem.config.js", "--env", "production"]
