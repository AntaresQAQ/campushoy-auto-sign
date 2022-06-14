FROM node:lts-alpine3.14
RUN apk add tzdata
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
RUN yarn --registry https://registry.npmmirror.com/ install --production && mkdir tasks
COPY dist ./dist
ENV TZ=Asia/Shanghai
VOLUME ["/app/config.yaml", "/app/tasks"]
CMD ["yarn", "start"]
