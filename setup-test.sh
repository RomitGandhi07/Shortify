#!/bin/bash

# Setup script for Shortify testing
# This script helps you get started quickly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🚀 Shortify Test Setup"
echo "=========================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
  echo -e "${YELLOW}⚠️  .env file already exists!${NC}"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}ℹ️  Keeping existing .env file${NC}"
    echo ""
    echo "You can run tests now with:"
    echo "  npm test"
    exit 0
  fi
fi

# Copy .env.example to .env
echo "📝 Creating .env file from .env.example..."
cp .env.example .env
echo -e "${GREEN}✅ .env file created${NC}"
echo ""

# Generate random secrets
echo "🔐 Generating secure secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Update secrets in .env
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  sed -i '' "s/COOKIE_SECRET=.*/COOKIE_SECRET=$COOKIE_SECRET/" .env
else
  # Linux
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  sed -i "s/COOKIE_SECRET=.*/COOKIE_SECRET=$COOKIE_SECRET/" .env
fi

echo -e "${GREEN}✅ JWT_SECRET generated and set${NC}"
echo -e "${GREEN}✅ COOKIE_SECRET generated and set${NC}"
echo ""

# Check MongoDB URI
MONGODB_URI=$(grep "^MONGODB_URI=" .env | cut -d '=' -f2)
if [ -z "$MONGODB_URI" ] || [[ "$MONGODB_URI" == *"your-mongodb-uri"* ]]; then
  echo -e "${YELLOW}⚠️  MongoDB URI needs configuration${NC}"
  echo ""
  echo "Current MongoDB URI is not set or uses default value."
  echo ""
  echo "Options:"
  echo "  1. Use the pre-configured MongoDB URI (already in .env.example)"
  echo "  2. Use local MongoDB: mongodb://localhost:27017/shortify"
  echo "  3. Enter your own MongoDB URI"
  echo ""
  read -p "Choose option (1/2/3) [default: 1]: " mongo_option
  
  case $mongo_option in
    2)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/shortify|" .env
      else
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/shortify|" .env
      fi
      echo -e "${GREEN}✅ MongoDB URI set to local instance${NC}"
      ;;
    3)
      read -p "Enter your MongoDB URI: " custom_uri
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=$custom_uri|" .env
      else
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=$custom_uri|" .env
      fi
      echo -e "${GREEN}✅ MongoDB URI set to custom value${NC}"
      ;;
    *)
      echo -e "${GREEN}✅ Using pre-configured MongoDB URI from .env.example${NC}"
      ;;
  esac
else
  echo -e "${GREEN}✅ MongoDB URI already configured${NC}"
fi

echo ""
echo "=========================================="
echo "✨ Setup Complete!"
echo "=========================================="
echo ""
echo "Your .env file is ready with:"
echo "  • Secure JWT_SECRET"
echo "  • Secure COOKIE_SECRET"
echo "  • MongoDB URI configured"
echo "  • BASE_URL set to http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Make sure MongoDB is running"
echo "  2. Run tests: npm test"
echo ""
echo "To run tests now:"
echo -e "  ${BLUE}npm test${NC}"
echo ""
