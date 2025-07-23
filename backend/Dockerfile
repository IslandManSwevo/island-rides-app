FROM node:20-alpine

# Install build dependencies and curl for health checks
RUN apk add --no-cache python3 make g++ py3-setuptools curl sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/uploads /app/logs

# Create a basic health endpoint check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:${PORT:-3003}/api/health || exit 1' > /app/health-check.sh && chmod +x /app/health-check.sh

# Expose ports
EXPOSE 3003
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /app/health-check.sh

# Start the application directly
CMD ["npm", "start"]