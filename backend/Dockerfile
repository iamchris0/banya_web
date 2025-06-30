# Use official Node.js LTS image
FROM node:23-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port
EXPOSE 3223

# Command to run the application
CMD ["node", "server.js"]