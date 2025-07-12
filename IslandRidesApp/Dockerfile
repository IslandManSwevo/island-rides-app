FROM node:20-alpine

ARG CI=false

WORKDIR /app

# Clear caches and install dependencies
RUN npm cache clean --force
RUN npm install -g @expo/cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install



# Copy source code
COPY . .

# Clean Expo cache
RUN rm -rf .expo

# Set Expo environment variables for Docker
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_USE_FAST_RESOLVER=1
ENV EXPO_NO_DOTENV=1

# Expose the ports Expo uses
EXPOSE 19006 19001 8081

# Use correct Expo start options for Docker
CMD ["sh", "-c", "rm -rf .expo && npm run start:web"]