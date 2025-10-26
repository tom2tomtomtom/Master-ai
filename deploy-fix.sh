#!/bin/bash

echo "🔧 Master AI Learning - Deployment Fix Script"
echo "============================================"

# 1. Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# 4. Run type checking
echo "🔍 Type checking..."
npx tsc --noEmit

# 5. Build the project
echo "🔨 Building project..."
npm run build

# 6. Test the build locally
echo "🧪 Testing build locally..."
npm run start &
SERVER_PID=$!
sleep 10

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Local server test passed"
    kill $SERVER_PID
else
    echo "❌ Local server test failed"
    kill $SERVER_PID
    exit 1
fi

echo "✅ Build successful! Ready for deployment."
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Netlify: netlify deploy --prod"
echo "2. Check live site: http://www.master-ai-learn.com"
echo "3. Monitor browser console for any runtime errors"
