#!/bin/bash

# Exit on error
set -e

# Run unit tests
echo "Running unit tests..."
npm test -- --silent

# Run type checking
echo "Running type checking..."
npm run type-check

# Run linting
echo "Running linting..."
npm run lint

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install --with-deps

# Run E2E tests
echo "Running E2E tests..."
npm run test:e2e

# Build the app
echo "Building the app for tests..."
npm run build

# Check if port 3000 is already in use
if ! lsof -i:3000 > /dev/null 2>&1; then
  echo "Starting server on port 3000..."
  npx serve -s .next -p 3000 &
  SERVER_STARTED=true
  sleep 5 # Give the server a moment to start
else
  echo "Server already running on port 3000, using existing server."
  SERVER_STARTED=false
fi

# Run visual tests
echo "Running visual tests..."
npm run test:visual

# Kill the server only if we started it
if [ "$SERVER_STARTED" = true ]; then
  echo "Shutting down server..."
  kill $(lsof -t -i:3000)
fi

# Build the project
echo "Building the project..."
npm run build

echo "Workflow completed locally!"
