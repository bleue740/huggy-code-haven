FROM node:20

WORKDIR /app

# Install pnpm for faster installs (optional)
RUN npm install -g pnpm

# Copy server package.json and install server deps
COPY server/package.json server/package-lock.json* ./
RUN npm install

# Copy template files
COPY server/templates/ ./templates/

# Copy server code
COPY server/index.js server/vite-builder.js ./

# Pre-install base node_modules for generated projects
RUN mkdir -p _base_modules && \
    cp templates/package.json _base_modules/package.json && \
    cd _base_modules && npm install --prefer-offline && \
    echo "Base modules installed."

# Create projects directory
RUN mkdir -p projects

EXPOSE 3000

CMD ["node", "index.js"]
