# Use official Node.js LTS image for build
FROM node:23-slim AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the Vite project
RUN npm run build

# Use a lightweight server to serve the static files
FROM node:23-slim

# Install serve to serve static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=build /app/dist ./dist

# Expose the port
EXPOSE 7777

# Command to serve the static files
CMD ["serve", "-s", "dist", "-l", "7777"]