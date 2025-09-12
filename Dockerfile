# ---- Stage 1: Build ----
# Use an official Node.js runtime as the builder image
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies.
# Using 'npm install' as a lock file is not present.
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production. Vite will output to /app/dist
RUN npm run build

# ---- Stage 2: Production ----
# Use a lightweight Nginx image to serve the static content
FROM nginx:stable-alpine

# Copy the built static files from the build stage to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script that injects the API key
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 80 to the outside world
EXPOSE 80

# Run the entrypoint script when the container starts
ENTRYPOINT ["/entrypoint.sh"]