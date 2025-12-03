#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Creating a short URL..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/urls \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://www.google.com", "title": "Google"}')
echo "Response: $RESPONSE"
SLUG=$(echo $RESPONSE | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
echo "Slug: $SLUG"

if [ -z "$SLUG" ]; then
  echo "Failed to create URL"
  exit 1
fi

echo -e "\n2. Getting all URLs..."
curl -s $BASE_URL/api/urls | head -c 200
echo "..."

echo -e "\n3. Getting specific URL metadata..."
curl -s $BASE_URL/api/urls/$SLUG
echo ""

echo -e "\n4. Testing Redirect (Simulating a visit)..."
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/$SLUG
echo ""

echo -e "\n5. Getting Analytics Summary..."
curl -s $BASE_URL/api/urls/$SLUG/analytics/summary
echo ""

echo -e "\n6. Getting Analytics Time Series..."
curl -s $BASE_URL/api/urls/$SLUG/analytics/timeseries
echo ""
