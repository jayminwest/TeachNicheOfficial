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

# Run visual tests with static server
echo "Running visual tests..."
npx serve -s .next -p 3000 &
sleep 5 # Give the server a moment to start
npm run test:visual
kill $(lsof -t -i:3000) # Kill the server when done

# Build the project
echo "Building the project..."
npm run build

echo "Workflow completed locally!"
