# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app


COPY package*.json ./
RUN npm ci


COPY tsconfig.json ./
COPY src ./src
RUN npm run build    # must run "tsc" via your package.json "build" script

COPY src/public ./dist/public


# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app


COPY package*.json ./
RUN npm ci --omit=dev


COPY --from=builder /app/dist ./dist


ENV NODE_ENV=production
ENV AWS_REGION=ap-southeast-2
EXPOSE 8080
CMD ["node", "dist/index.js"]
