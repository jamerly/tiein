# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the backend
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app/server
COPY server/pom.xml ./
COPY server/src ./src
RUN mvn clean install -DskipTests

# Stage 3: Final image with Nginx
FROM eclipse-temurin:21-jre-alpine

# Install Nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy frontend build artifacts to Nginx static directory
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy backend build artifact
COPY --from=backend-build /app/server/target/*.jar /app/app.jar

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose Nginx port 
EXPOSE 8083

# Create a script to start both Nginx and Java application
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

ENTRYPOINT ["start.sh"]
