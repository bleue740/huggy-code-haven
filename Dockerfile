FROM node:20

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm install

COPY server/ .

# Build the preview image for isolated sandboxes
COPY server/Dockerfile.preview /app/Dockerfile.preview
RUN docker build -t preview-image -f /app/Dockerfile.preview . || true

EXPOSE 3000

CMD ["node", "index.js"]
