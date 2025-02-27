#!/bin/bash

# Script to run all test scripts after fixing them

echo "Running all test scripts..."

# First, fix the test scripts
bash scripts/fix-test-scripts.sh

# Test Firebase Storage
echo "Testing Firebase Storage..."
node scripts/test-firebase-storage.ts

# Test Email Service
echo "Testing Email Service..."
node scripts/test-email-service.ts

# Test Database Service (if Cloud SQL is set up)
if [ -n "$CLOUD_SQL_HOST" ]; then
  echo "Testing Database Service..."
  node scripts/test-database-service.ts
else
  echo "Skipping Database Service test - CLOUD_SQL_HOST not set"
fi

# Verify migration (if Cloud SQL is set up)
if [ -n "$CLOUD_SQL_HOST" ]; then
  echo "Verifying migration..."
  node scripts/verify-migration.ts
else
  echo "Skipping migration verification - CLOUD_SQL_HOST not set"
fi

echo "All tests completed!"
