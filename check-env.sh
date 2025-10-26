#!/bin/bash

echo "🔍 Checking Environment Variables for Master AI Learning"
echo "======================================================="

# Required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "STRIPE_SECRET_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "EMAIL_SERVER_HOST"
  "EMAIL_SERVER_PORT"
  "EMAIL_SERVER_USER"
  "EMAIL_SERVER_PASSWORD"
  "EMAIL_FROM"
  "NEXT_PUBLIC_SITE_URL"
)

echo "Checking production environment variables..."
echo ""

MISSING_VARS=()

# Check each variable
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^$var=" .env.production 2>/dev/null; then
    echo "✅ $var is set"
  else
    echo "❌ $var is MISSING"
    MISSING_VARS+=($var)
  fi
done

echo ""
if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set!"
else
  echo "❌ Missing ${#MISSING_VARS[@]} environment variables:"
  printf '%s\n' "${MISSING_VARS[@]}"
  echo ""
  echo "Please set these in your Netlify dashboard:"
  echo "1. Go to https://app.netlify.com"
  echo "2. Select your site"
  echo "3. Go to Site Settings > Environment Variables"
  echo "4. Add the missing variables"
fi
