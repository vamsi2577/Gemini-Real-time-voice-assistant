#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the path to the main HTML file
HTML_FILE=/usr/share/nginx/html/index.html

# Check if the API_KEY environment variable is set
if [ -z "${API_KEY}" ]; then
  echo "Error: The API_KEY environment variable is not set."
  echo "Please set it when running the container."
  exit 1
fi

echo "Injecting API Key into ${HTML_FILE}..."

# Use sed to replace the placeholder with the actual API key.
# The use of '|' as a delimiter avoids issues if the API key contains slashes.
sed -i "s|__API_KEY_PLACEHOLDER__|${API_KEY}|g" ${HTML_FILE}

echo "API Key injected successfully."

# Start the Nginx server in the foreground.
# 'exec' replaces the shell process with the nginx process, which is a best practice for containers.
exec nginx -g 'daemon off;'