FROM node:20-alpine

# Install build dependencies and curl for health checks
RUN apk add --no-cache python3 make g++ py3-setuptools curl postgresql-client

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
RUN echo '#!/bin/sh\ncurl -f http://localhost:${PORT:-3000}/api/health || exit 1' > /app/health-check.sh && chmod +x /app/health-check.sh

# Wait for PostgreSQL script
RUN echo '#!/bin/sh\nuntil pg_isready -h postgres -p 5432; do echo "Waiting for PostgreSQL..."; sleep 2; done; echo "PostgreSQL is ready!"' > /app/wait-for-postgres.sh && chmod +x /app/wait-for-postgres.sh

# Expose port (configurable via environment variable)
EXPOSE ${PORT:-3000}

# Health check - try both endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /app/health-check.sh

# Use wait script to ensure PostgreSQL is ready
CMD ["sh", "-c", "/app/wait-for-postgres.sh && npm start"]