FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile
COPY . .

FROM node:18-slim
WORKDIR /app
COPY --from=builder /app ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]

