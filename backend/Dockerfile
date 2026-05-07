# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build
RUN mkdir -p dist/generated && cp -R src/generated/prisma dist/generated/prisma

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace=backend

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/index.js"]
