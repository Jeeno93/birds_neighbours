FROM node:22-alpine

WORKDIR /app

COPY artifacts/pernatye-sosedi-api/package.json ./
COPY artifacts/pernatye-sosedi-api/tsconfig.json ./

RUN npm install

COPY artifacts/pernatye-sosedi-api/src ./src
COPY artifacts/pernatye-sosedi-api/migrations ./migrations

RUN npm run build

EXPOSE 80

CMD ["node", "dist/index.js"]
