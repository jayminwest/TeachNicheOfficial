#!/bin/bash

# Create a directory for the results
mkdir -p ./cleanup-results

# Check for usages of ManualPublishButton
echo "Checking ManualPublishButton usage..."
grep -r "ManualPublishButton" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/manual-publish-button.txt

# Check for usages of AuthRedirect
echo "Checking AuthRedirect usage..."
grep -r "AuthRedirect" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/auth-redirect.txt

# Check for usages of useAuthGuard
echo "Checking useAuthGuard usage..."
grep -r "useAuthGuard" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/use-auth-guard.txt

# Check for usages of safeNumberValue
echo "Checking safeNumberValue usage..."
grep -r "safeNumberValue" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/safe-number-value.txt

# Check for usages of retry
echo "Checking retry usage..."
grep -r "retry" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/retry.txt

# Check for usages of isValidMuxAssetId
echo "Checking isValidMuxAssetId usage..."
grep -r "isValidMuxAssetId" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/is-valid-mux-asset-id.txt

# Check for usages of getErrorDetails
echo "Checking getErrorDetails usage..."
grep -r "getErrorDetails" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/get-error-details.txt

# Check for usages of calculateFees
echo "Checking calculateFees usage..."
grep -r "calculateFees" --include="*.tsx" --include="*.ts" ./app > ./cleanup-results/calculate-fees.txt

echo "All checks completed. Results are in the cleanup-results directory."
