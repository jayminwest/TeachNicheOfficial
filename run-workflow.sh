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
npm run test:e2e -- --update-snapshots

# Build the app
echo "Building the app for tests..."
npm run build

# Run visual tests
echo "Running visual tests..."
npm run test:visual

echo "Workflow completed locally!"
