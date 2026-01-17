FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for Electron build
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libuuid1 \
    libsecret-1-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Build Linux distribution
RUN npm run dist:linux

# Final stage - just copy the built artifacts
FROM alpine:latest AS artifacts

WORKDIR /release

COPY --from=builder /app/release/*.AppImage ./
COPY --from=builder /app/release/*.deb ./

# Default command shows available artifacts
CMD ["ls", "-la", "/release"]
