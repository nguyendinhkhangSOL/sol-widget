# ── Stage 1: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Cài OpenSSL + libc6-compat — Prisma engine cần libssl để chạy.
# node:20-alpine không có sẵn 2 thư viện này → phải apk add tay.
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install

# Copy schema TRƯỚC khi prisma generate để cache layer hiệu quả
COPY prisma ./prisma
RUN npx prisma generate

# Copy phần còn lại (tránh node_modules host nhờ .dockerignore)
COPY . .
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Runtime cũng cần openssl + libc6-compat để Prisma engine load được
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000

# Re-generate Prisma client lúc startup nếu cần (defensive). Sau đó migrate
# rồi start server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
