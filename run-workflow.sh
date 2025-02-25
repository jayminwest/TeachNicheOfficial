#!/bin/bash

# Run unit tests
echo "Running unit tests..."
npm test

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

# Run visual tests
echo "Running visual tests..."
npm run test:visual

# Build the project
echo "Building the project..."
npm run build

echo "Workflow completed locally!"
