# Building layer
FROM node:16-alpine AS development


WORKDIR /app

COPY tsconfig*.json ./
COPY package*.json ./

RUN npm ci

COPY src/ src/

RUN npm run build


FROM node:16-alpine AS production


WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=development /app/dist/ ./dist/

CMD [ "node", "dist/main.js" ]