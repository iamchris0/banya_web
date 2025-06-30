# Build stage
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
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

EXPOSE 7777

CMD ["serve", "-s", "dist", "-l", "7777"]
