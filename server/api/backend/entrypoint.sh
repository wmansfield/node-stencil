#!/bin/bash
set -e

# Entrypoint script that fetches secrets from AWS Secrets Manager
# and exports them as environment variables before starting the app

# If SECRETS_NAME is set, fetch secrets from AWS Secrets Manager
if [ -n "$SECRETS_NAME" ]; then
    echo "Fetching secrets from AWS Secrets Manager: $SECRETS_NAME"
    
    # Fetch secret value using AWS CLI
    SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRETS_NAME" \
        --region "${AWS_REGION:-us-east-1}" \
        --query SecretString \
        --output text 2>/dev/null) || {
        echo "Warning: Failed to fetch secrets from $SECRETS_NAME"
        SECRET_JSON=""
    }
    
    if [ -n "$SECRET_JSON" ]; then
        # Parse JSON and export each key as an environment variable
        # Using node since we're in a Node.js container
        eval $(node -e "
            const secrets = JSON.parse(process.argv[1]);
            for (const [key, value] of Object.entries(secrets)) {
                // Escape single quotes in values
                const escaped = String(value).replace(/'/g, \"'\\\"'\\\"'\");
                console.log(\`export \${key}='\${escaped}'\`);
            }
        " "$SECRET_JSON")
        
        echo "Secrets loaded successfully ($(echo "$SECRET_JSON" | node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync(0, 'utf8'))).length)") variables)"
    fi
else
    echo "SECRETS_NAME not set, skipping secrets fetch"
fi

# Execute the main command
exec "$@"
