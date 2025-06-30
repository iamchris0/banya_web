# Use Node.js LTS image
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose the port (will be mapped by docker-compose)
EXPOSE 3223

CMD ["node", "server.js"]
