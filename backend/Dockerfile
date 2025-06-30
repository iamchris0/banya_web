# Use Node.js LTS image
FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Expose the port (will be mapped by docker-compose)
EXPOSE ${BACKEND_PORT}

CMD ["node", "server.js"]
