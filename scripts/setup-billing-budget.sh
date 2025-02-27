#!/bin/bash

# Script to set up a billing budget for the GCP project

# Get the billing account ID
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name.basename())" | head -n 1)

if [ -z "$BILLING_ACCOUNT" ]; then
  echo "No billing accounts found. Please make sure you have a billing account set up."
  exit 1
fi

echo "Using billing account: $BILLING_ACCOUNT"

# Create the budget
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="Teach Niche Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100

echo "Budget created successfully!"
