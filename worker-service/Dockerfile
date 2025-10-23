FROM node:20-alpine

# ffmpeg & awscli for simple S3 cp (replace with SDK streams if preferred)
RUN apk add --no-cache ffmpeg python3 py3-pip && pip3 install awscli

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
CMD ["node", "dist/worker.js"]
