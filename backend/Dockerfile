FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY backend/prisma ./prisma

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY backend/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
