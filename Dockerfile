# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN rm -f package-lock.json
RUN rm -rf node_modules
RUN npm install
COPY . .
RUN npx vite build

# Stage 2: Serve with Node.js
FROM node:18-alpine

WORKDIR /app

# Install serve package
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Start the server with SPA fallback
CMD ["serve", "-s", "dist", "-l", "8080"]