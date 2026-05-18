#!/bin/bash

# Runtime configuration injection script
# This script replaces placeholders in the built React app with actual environment variables

set -e

echo "Injecting runtime configuration..."

# Get environment variables (no fallbacks - must be provided)
API_BASE_URL="${VITE_API_BASE_URL}"
FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY}"
FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN}"
FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID}"
FIREBASE_STORAGE_BUCKET="${VITE_FIREBASE_STORAGE_BUCKET}"
FIREBASE_MESSAGING_SENDER_ID="${VITE_FIREBASE_MESSAGING_SENDER_ID}"
FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID}"
ADMIN_GATE_TOKEN="${VITE_ADMIN_GATE_TOKEN}"

# Validate required environment variables
if [ -z "$API_BASE_URL" ]; then
    echo "Error: VITE_API_BASE_URL environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_API_KEY" ]; then
    echo "Error: VITE_FIREBASE_API_KEY environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_AUTH_DOMAIN" ]; then
    echo "Error: VITE_FIREBASE_AUTH_DOMAIN environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "Error: VITE_FIREBASE_PROJECT_ID environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_STORAGE_BUCKET" ]; then
    echo "Error: VITE_FIREBASE_STORAGE_BUCKET environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_MESSAGING_SENDER_ID" ]; then
    echo "Error: VITE_FIREBASE_MESSAGING_SENDER_ID environment variable is required"
    exit 1
fi

if [ -z "$FIREBASE_APP_ID" ]; then
    echo "Error: VITE_FIREBASE_APP_ID environment variable is required"
    exit 1
fi

echo "Configuration:"
echo "  API_BASE_URL: $API_BASE_URL"
echo "  FIREBASE_API_KEY: $FIREBASE_API_KEY"
echo "  FIREBASE_AUTH_DOMAIN: $FIREBASE_AUTH_DOMAIN"
echo "  FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"
echo "  FIREBASE_STORAGE_BUCKET: $FIREBASE_STORAGE_BUCKET"
echo "  FIREBASE_MESSAGING_SENDER_ID: $FIREBASE_MESSAGING_SENDER_ID"
echo "  FIREBASE_APP_ID: $FIREBASE_APP_ID"
echo "  ADMIN_GATE_TOKEN: [set=${ADMIN_GATE_TOKEN:+yes}${ADMIN_GATE_TOKEN:-no}]"

# Find all JavaScript files in the Vite build assets directory
JS_FILES=$(find ./build/assets -name "*.js" -type f 2>/dev/null || true)

if [ -n "$JS_FILES" ]; then
    echo "Found JavaScript files, injecting configuration..."
    
    # Replace placeholders with actual environment variables
    for file in $JS_FILES; do
        if [ -f "$file" ]; then
            echo "Processing: $file"
            
            # Replace API_BASE_URL placeholder
            if grep -q "__API_BASE_URL__" "$file"; then
                sed -i "s|__API_BASE_URL__|$API_BASE_URL|g" "$file"
                echo "  - Injected API_BASE_URL: $API_BASE_URL"
            fi
            
            # Replace FIREBASE_API_KEY placeholder
            if grep -q "__FIREBASE_API_KEY__" "$file"; then
                sed -i "s|__FIREBASE_API_KEY__|$FIREBASE_API_KEY|g" "$file"
                echo "  - Injected FIREBASE_API_KEY: $FIREBASE_API_KEY"
            fi
            
            # Replace FIREBASE_AUTH_DOMAIN placeholder
            if grep -q "__FIREBASE_AUTH_DOMAIN__" "$file"; then
                sed -i "s|__FIREBASE_AUTH_DOMAIN__|$FIREBASE_AUTH_DOMAIN|g" "$file"
                echo "  - Injected FIREBASE_AUTH_DOMAIN: $FIREBASE_AUTH_DOMAIN"
            fi
            
            # Replace FIREBASE_PROJECT_ID placeholder
            if grep -q "__FIREBASE_PROJECT_ID__" "$file"; then
                sed -i "s|__FIREBASE_PROJECT_ID__|$FIREBASE_PROJECT_ID|g" "$file"
                echo "  - Injected FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"
            fi
            
            # Replace FIREBASE_STORAGE_BUCKET placeholder
            if grep -q "__FIREBASE_STORAGE_BUCKET__" "$file"; then
                sed -i "s|__FIREBASE_STORAGE_BUCKET__|$FIREBASE_STORAGE_BUCKET|g" "$file"
                echo "  - Injected FIREBASE_STORAGE_BUCKET: $FIREBASE_STORAGE_BUCKET"
            fi
            
            # Replace FIREBASE_MESSAGING_SENDER_ID placeholder
            if grep -q "__FIREBASE_MESSAGING_SENDER_ID__" "$file"; then
                sed -i "s|__FIREBASE_MESSAGING_SENDER_ID__|$FIREBASE_MESSAGING_SENDER_ID|g" "$file"
                echo "  - Injected FIREBASE_MESSAGING_SENDER_ID: $FIREBASE_MESSAGING_SENDER_ID"
            fi
            
            # Replace FIREBASE_APP_ID placeholder
            if grep -q "__FIREBASE_APP_ID__" "$file"; then
                sed -i "s|__FIREBASE_APP_ID__|$FIREBASE_APP_ID|g" "$file"
                echo "  - Injected FIREBASE_APP_ID: $FIREBASE_APP_ID"
            fi
            
            # Replace ADMIN_GATE_TOKEN placeholder
            if grep -q "__ADMIN_GATE_TOKEN__" "$file"; then
                sed -i "s|__ADMIN_GATE_TOKEN__|$ADMIN_GATE_TOKEN|g" "$file"
                echo "  - Injected ADMIN_GATE_TOKEN: [redacted]"
            fi
        fi
    done
    
    echo "Configuration injection completed successfully"
else
    echo "Warning: No JavaScript files found in ./build/assets"
    echo "This might indicate the build process didn't complete properly"
fi

# Start Vite preview server
echo "Starting Vite preview server..."
exec npm run preview -- --host 0.0.0.0 --port 3000
