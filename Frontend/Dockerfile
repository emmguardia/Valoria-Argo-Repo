FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN apk update && apk upgrade --no-cache \
    && if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --loglevel=error; else npm install --no-audit --no-fund --loglevel=error; fi

COPY . .
RUN npm run build

FROM nginx:alpine

RUN apk update && apk upgrade -a --no-cache && rm -rf /var/cache/apk/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
