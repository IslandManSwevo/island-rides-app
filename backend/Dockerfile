FROM node:20-alpine

# Install build dependencies and curl for health checks
RUN apk add --no-cache python3 make g++ py3-setuptools curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create database directory
RUN mkdir -p /app/data

# Create a basic health endpoint check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3003/api/health || curl -f http://localhost:3003/ || exit 1' > /app/health-check.sh && chmod +x /app/health-check.sh

# Expose port
EXPOSE 3003

# Health check - try both endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /app/health-check.sh

CMD ["npm", "start"] 