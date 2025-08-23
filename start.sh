#!/bin/sh

# Start Nginx in the background
nginx &

# Start the Java application
java -jar /app/app.jar
