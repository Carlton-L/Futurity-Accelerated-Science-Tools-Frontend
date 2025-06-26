# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
# If you are using yarn, uncomment the next line and comment out the npm ci line
# COPY yarn.lock ./

# Install dependencies
RUN rm -f package-lock.json # Explicitly remove package-lock.json
RUN rm -rf node_modules # Good practice to ensure a clean state
RUN npm install
# If you are using yarn, uncomment the next line and comment out the npm ci line
# RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN npx vite build
# If you are using yarn, uncomment the next line and comment out the npm run build line
# RUN yarn build

# Stage 2: Serve the application with a lightweight server (e.g., Nginx)
FROM nginx:stable-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]