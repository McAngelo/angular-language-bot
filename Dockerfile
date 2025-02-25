# Stage 1: Build the Angular application
FROM node:18 AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Angular app into the server-build directory
RUN npm run build -- --output-path=server-build/browser/ --configuration=production

# Stage 2: Serve the app using Express
FROM node:18-alpine AS server

# Set working directory inside the container
WORKDIR /app

# List contents of /app to verify
RUN ls -la /app

#RUN ls -la /app/server-build

# Copy only the built Angular app from the previous stage
COPY --from=build /app/server-build /app
COPY --from=build /app/server-build/package*.json ./

# Install only production dependencies
RUN npm install 
#--only=production

# Expose the port that the Express server will use
EXPOSE 3000

# Start the Express server
CMD ["node", "server.js"]
