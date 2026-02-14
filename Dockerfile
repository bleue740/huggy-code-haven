FROM node:20

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm install

COPY server/ .

EXPOSE 3000

CMD ["node", "index.js"]
