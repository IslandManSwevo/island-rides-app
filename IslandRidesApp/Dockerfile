FROM node:20-alpine

WORKDIR /app

# Install global dependencies
RUN npm install -g @expo/cli

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci to handle package.json changes)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set Expo environment variables for Docker
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_USE_FAST_RESOLVER=1
ENV EXPO_NO_DOTENV=1
ENV CI=1

# Expose the ports Expo uses
EXPOSE 19006 19001

# Use correct Expo start options for Docker
CMD ["npx", "expo", "start", "--port", "19006", "--host", "lan", "--clear"] 