FROM node:18 AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM node:18-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
