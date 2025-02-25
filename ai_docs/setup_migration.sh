#!/bin/bash

# Script to create the new documentation directory structure
# Created: 2025-02-24

echo "Creating new documentation directory structure..."

# Create main directories
mkdir -p ai_docs/core
mkdir -p ai_docs/guides/development
mkdir -p ai_docs/guides/deployment
mkdir -p ai_docs/guides/maintenance
mkdir -p ai_docs/standards/code
mkdir -p ai_docs/standards/testing
mkdir -p ai_docs/standards/security
mkdir -p ai_docs/standards/documentation
mkdir -p ai_docs/processes/onboarding
mkdir -p ai_docs/processes/incident
mkdir -p ai_docs/processes/release
mkdir -p ai_docs/processes/development
mkdir -p ai_docs/processes/planning
mkdir -p ai_docs/reference/apis
mkdir -p ai_docs/reference/data
mkdir -p ai_docs/reference/infrastructure
mkdir -p ai_docs/templates

echo "Directory structure created successfully!"
echo "Ready to begin Phase 1 of the migration plan."
