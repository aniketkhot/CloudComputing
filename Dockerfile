FROM node:20-bullseye


RUN apt-get update
RUN apt-get install -y ffmpeg


WORKDIR /app


COPY package*.json tsconfig.json ./


RUN npm ci


COPY ./src ./src


RUN npm run build


EXPOSE 8080


CMD ["npm","start"]
