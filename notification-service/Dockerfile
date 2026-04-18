FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

EXPOSE 4004

CMD ["node", "dist/main"]

