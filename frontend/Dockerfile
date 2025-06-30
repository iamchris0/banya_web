# Build stage
FROM node:20 as build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

# Install serve to serve the static files
RUN npm install -g serve

EXPOSE ${FRONTEND_PORT}

CMD ["serve", "-s", "dist", "-l", "${FRONTEND_PORT}"]
