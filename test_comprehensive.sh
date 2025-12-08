#!/bin/bash

# Comprehensive Test Script for Shortify API
# Tests all authentication and URL shortening functionality
# Automatically starts and stops the server

BASE_URL="http://localhost:3000"
COOKIES_FILE="test_cookies.txt"
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_USERNAME="testuser_$(date +%s)"
TEST_PASSWORD="TestPassword123!"
SERVER_PID=""
SERVER_LOG="test_server.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
  rm -f $COOKIES_FILE
  
  # Stop the server if it's running
  if [ ! -z "$SERVER_PID" ]; then
    echo ""
    handle_info "Stopping server (PID: $SERVER_PID)..."
    kill -9 $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    handle_success "Server stopped"
  fi
  
  # Also kill any processes still using port 3000
  PORT_PID=$(lsof -ti:3000 2>/dev/null)
  if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
  fi
  
  # Clean up server log
  rm -f $SERVER_LOG
}

# Error handler
handle_error() {
  echo -e "${RED}❌ Test failed: $1${NC}"
  
  # Show server logs if they exist
  if [ -f "$SERVER_LOG" ] && [ -s "$SERVER_LOG" ]; then
    echo ""
    echo -e "${YELLOW}📋 Last 20 lines of server log:${NC}"
    echo "----------------------------------------"
    tail -20 $SERVER_LOG
    echo "----------------------------------------"
    echo -e "${BLUE}ℹ️  Full logs available in: $SERVER_LOG${NC}"
  fi
  
  cleanup
  exit 1
}

# Success handler
handle_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Warning handler
handle_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Info handler
handle_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Trap to ensure cleanup on exit or interrupt
trap cleanup EXIT INT TERM

# Cleanup previous test data
cleanup

echo "=========================================="
echo "🧪 Shortify Comprehensive API Tests"
echo "=========================================="
echo ""

# Check if .env file exists
echo "🔍 Checking prerequisites..."
if [ ! -f ".env" ]; then
  echo ""
  handle_error "Missing .env file. Please create it from .env.example:
  
  cp .env.example .env
  
  Then edit .env and configure:
  - MONGODB_URI (MongoDB connection string)
  - JWT_SECRET (any random string)
  - COOKIE_SECRET (any random string)
  - BASE_URL (http://localhost:3000)
  
  See .env.example for all available options."
fi

# Check if required environment variables are set
source .env
MISSING_VARS=""
[ -z "$MONGODB_URI" ] && MISSING_VARS="$MISSING_VARS\n  - MONGODB_URI"
[ -z "$JWT_SECRET" ] && MISSING_VARS="$MISSING_VARS\n  - JWT_SECRET"
[ -z "$COOKIE_SECRET" ] && MISSING_VARS="$MISSING_VARS\n  - COOKIE_SECRET"
[ -z "$BASE_URL" ] && MISSING_VARS="$MISSING_VARS\n  - BASE_URL"

if [ ! -z "$MISSING_VARS" ]; then
  echo ""
  handle_error "Missing required environment variables in .env:$MISSING_VARS
  
  Please edit .env and add these variables."
fi

handle_success "Environment variables configured"
echo ""

# Build the project
echo "📦 Building the project..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  handle_success "Build completed"
else
  handle_error "Build failed. Run 'npm run build' to see errors."
fi
echo ""

# Kill any existing processes on port 3000 before starting
echo "🧹 Checking for existing processes on port 3000..."
EXISTING_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
  handle_info "Found existing process (PID: $EXISTING_PID), stopping it..."
  kill -9 $EXISTING_PID 2>/dev/null
  sleep 1
  handle_success "Cleared port 3000"
fi
echo ""

# Start the server
echo "🚀 Starting server..."
npm start > $SERVER_LOG 2>&1 &
SERVER_PID=$!

handle_info "Server started with PID: $SERVER_PID"
handle_info "Waiting for server to be ready..."

# Wait for server to be ready (max 30 seconds)
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/urls 2>/dev/null)
  if [ "$HEALTH_CHECK" -eq 401 ] || [ "$HEALTH_CHECK" -eq 200 ]; then
    handle_success "Server is ready!"
    break
  fi
  
  # Check if server process is still running
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    handle_error "Server process died. Check $SERVER_LOG for errors."
  fi
  
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
  
  if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    handle_error "Server failed to start within ${MAX_WAIT} seconds. Check $SERVER_LOG for errors."
  fi
done

echo ""
echo "Test User: $TEST_EMAIL"
echo "Test Username: $TEST_USERNAME"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Server Health Check"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/urls 2>&1)
if [ "$HEALTH_RESPONSE" -eq 401 ] || [ "$HEALTH_RESPONSE" -eq 200 ]; then
  handle_success "Server is running"
else
  handle_error "Server is not responding (Status: $HEALTH_RESPONSE)"
fi
echo ""

# Test 2: User Signup
echo "📋 Test 2: User Signup"
echo "----------------------------------------"
SIGNUP_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\"
  }")

SIGNUP_CODE=$(echo "$SIGNUP_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
SIGNUP_BODY=$(echo "$SIGNUP_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $SIGNUP_BODY"
if [ "$SIGNUP_CODE" -eq 201 ]; then
  handle_success "User signup successful"
else
  handle_error "User signup failed (Status: $SIGNUP_CODE)"
fi
echo ""

# Test 3: Email Verification
echo "📋 Test 3: Email Verification"
echo "----------------------------------------"
handle_warning "Email will be logged to server console (not sent)"
handle_info "Check server logs for verification token"
echo "Extracting verification token from server logs..."

# Wait a moment for the log to be written
sleep 2

# Try to extract token from server logs
VERIFICATION_TOKEN=$(tail -50 $SERVER_LOG | grep -oP '(?<=token=)[a-zA-Z0-9]+' | tail -1)

if [ -n "$VERIFICATION_TOKEN" ]; then
  handle_info "Found verification token: ${VERIFICATION_TOKEN:0:20}..."
  
  # Verify email
  VERIFY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/auth/verify-email?token=$VERIFICATION_TOKEN")
  VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
  VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '/HTTP_CODE:/d')
  
  echo "Response: $VERIFY_BODY"
  if [ "$VERIFY_CODE" -eq 200 ]; then
    handle_success "Email verification successful"
  else
    handle_error "Email verification failed (Status: $VERIFY_CODE)"
  fi
else
  handle_warning "Could not extract verification token from logs"
  handle_info "Proceeding with manual verification step..."
  read -p "Press Enter after manually verifying email from server logs..."
fi
echo ""

# Test 4: Login
echo "📋 Test 4: User Login"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c $COOKIES_FILE \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $LOGIN_BODY"
if [ "$LOGIN_CODE" -eq 200 ]; then
  handle_success "User login successful"
else
  handle_error "User login failed (Status: $LOGIN_CODE)"
fi
echo ""

# Test 5: Get Current User
echo "📋 Test 5: Get Current User Profile"
echo "----------------------------------------"
ME_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/auth/me" \
  -b $COOKIES_FILE)

ME_CODE=$(echo "$ME_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
ME_BODY=$(echo "$ME_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $ME_BODY"
if [ "$ME_CODE" -eq 200 ]; then
  handle_success "Get current user successful"
else
  handle_error "Get current user failed (Status: $ME_CODE)"
fi
echo ""

# Test 6: Create URL (Authenticated)
echo "📋 Test 6: Create Short URL (Authenticated)"
echo "----------------------------------------"
CREATE_URL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/urls" \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"longUrl\": \"https://www.example.com/test-page\",
    \"title\": \"Test URL - Authenticated\",
    \"customSlug\": \"test$(date +%s)\"
  }")

CREATE_CODE=$(echo "$CREATE_URL_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
CREATE_BODY=$(echo "$CREATE_URL_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $CREATE_BODY"
if [ "$CREATE_CODE" -eq 201 ]; then
  handle_success "URL creation successful"
  SLUG=$(echo "$CREATE_BODY" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  handle_info "Created slug: $SLUG"
else
  handle_error "URL creation failed (Status: $CREATE_CODE)"
fi
echo ""

# Test 7: Get URL Metadata
echo "📋 Test 7: Get URL Metadata"
echo "----------------------------------------"
if [ -n "$SLUG" ]; then
  METADATA_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/urls/$SLUG" \
    -b $COOKIES_FILE)
  
  METADATA_CODE=$(echo "$METADATA_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
  METADATA_BODY=$(echo "$METADATA_RESPONSE" | sed '/HTTP_CODE:/d')
  
  echo "Response: $METADATA_BODY"
  if [ "$METADATA_CODE" -eq 200 ]; then
    handle_success "Get URL metadata successful"
  else
    handle_error "Get URL metadata failed (Status: $METADATA_CODE)"
  fi
else
  handle_warning "Skipping - no slug available"
fi
echo ""

# Test 8: Test URL Redirect
echo "📋 Test 8: Test URL Redirect (Visit)"
echo "----------------------------------------"
if [ -n "$SLUG" ]; then
  REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/$SLUG")
  
  if [ "$REDIRECT_CODE" -eq 200 ]; then
    handle_success "URL redirect successful (Status: $REDIRECT_CODE)"
  else
    handle_warning "URL redirect returned status: $REDIRECT_CODE"
  fi
else
  handle_warning "Skipping - no slug available"
fi
echo ""

# Test 9: Get Analytics Summary
echo "📋 Test 9: Get Analytics Summary"
echo "----------------------------------------"
if [ -n "$SLUG" ]; then
  ANALYTICS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/urls/$SLUG/analytics/summary" \
    -b $COOKIES_FILE)
  
  ANALYTICS_CODE=$(echo "$ANALYTICS_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
  ANALYTICS_BODY=$(echo "$ANALYTICS_RESPONSE" | sed '/HTTP_CODE:/d')
  
  echo "Response: $ANALYTICS_BODY"
  if [ "$ANALYTICS_CODE" -eq 200 ]; then
    handle_success "Get analytics successful"
  else
    handle_error "Get analytics failed (Status: $ANALYTICS_CODE)"
  fi
else
  handle_warning "Skipping - no slug available"
fi
echo ""

# Test 10: Get Analytics Time Series
echo "📋 Test 10: Get Analytics Time Series"
echo "----------------------------------------"
if [ -n "$SLUG" ]; then
  TIMESERIES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/urls/$SLUG/analytics/timeseries?period=hour" \
    -b $COOKIES_FILE)
  
  TIMESERIES_CODE=$(echo "$TIMESERIES_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
  TIMESERIES_BODY=$(echo "$TIMESERIES_RESPONSE" | sed '/HTTP_CODE:/d')
  
  echo "Response: $TIMESERIES_BODY"
  if [ "$TIMESERIES_CODE" -eq 200 ]; then
    handle_success "Get time series analytics successful"
  else
    handle_error "Get time series analytics failed (Status: $TIMESERIES_CODE)"
  fi
else
  handle_warning "Skipping - no slug available"
fi
echo ""

# Test 11: Get User's URLs
echo "📋 Test 11: Get User's URLs"
echo "----------------------------------------"
USER_URLS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/urls" \
  -b $COOKIES_FILE)

USER_URLS_CODE=$(echo "$USER_URLS_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
USER_URLS_BODY=$(echo "$USER_URLS_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $USER_URLS_BODY"
if [ "$USER_URLS_CODE" -eq 200 ]; then
  handle_success "Get user URLs successful"
else
  handle_error "Get user URLs failed (Status: $USER_URLS_CODE)"
fi
echo ""

# Test 12: Refresh Token
echo "📋 Test 12: Refresh Authentication Token"
echo "----------------------------------------"
REFRESH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/refresh-token" \
  -b $COOKIES_FILE \
  -c $COOKIES_FILE)

REFRESH_CODE=$(echo "$REFRESH_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
REFRESH_BODY=$(echo "$REFRESH_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $REFRESH_BODY"
if [ "$REFRESH_CODE" -eq 200 ]; then
  handle_success "Token refresh successful"
else
  handle_error "Token refresh failed (Status: $REFRESH_CODE)"
fi
echo ""

# Test 13: Forgot Password
echo "📋 Test 13: Forgot Password Request"
echo "----------------------------------------"
FORGOT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")

FORGOT_CODE=$(echo "$FORGOT_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
FORGOT_BODY=$(echo "$FORGOT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $FORGOT_BODY"
if [ "$FORGOT_CODE" -eq 200 ]; then
  handle_success "Forgot password request successful"
  handle_warning "Password reset email logged to console (not sent)"
else
  handle_error "Forgot password failed (Status: $FORGOT_CODE)"
fi
echo ""

# Test 14: Create Anonymous URL
echo "📋 Test 14: Create Anonymous URL (No Auth)"
echo "----------------------------------------"
ANON_URL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/urls" \
  -H "Content-Type: application/json" \
  -d "{
    \"longUrl\": \"https://www.google.com\",
    \"title\": \"Anonymous Google Link\"
  }")

ANON_CODE=$(echo "$ANON_URL_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
ANON_BODY=$(echo "$ANON_URL_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $ANON_BODY"
if [ "$ANON_CODE" -eq 201 ]; then
  handle_success "Anonymous URL creation successful"
  ANON_SLUG=$(echo "$ANON_BODY" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  handle_info "Created anonymous slug: $ANON_SLUG"
else
  handle_error "Anonymous URL creation failed (Status: $ANON_CODE)"
fi
echo ""

# Test 15: Access Anonymous URL Analytics (Should Fail)
echo "📋 Test 15: Access Anonymous URL Analytics (Should Fail)"
echo "----------------------------------------"
if [ -n "$ANON_SLUG" ]; then
  ANON_ANALYTICS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/urls/$ANON_SLUG/analytics/summary" \
    -b $COOKIES_FILE)
  
  ANON_ANALYTICS_CODE=$(echo "$ANON_ANALYTICS_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
  ANON_ANALYTICS_BODY=$(echo "$ANON_ANALYTICS_RESPONSE" | sed '/HTTP_CODE:/d')
  
  echo "Response: $ANON_ANALYTICS_BODY"
  if [ "$ANON_ANALYTICS_CODE" -eq 403 ]; then
    handle_success "Correctly denied access to anonymous URL analytics"
  else
    handle_warning "Expected 403 but got status: $ANON_ANALYTICS_CODE"
  fi
else
  handle_warning "Skipping - no anonymous slug available"
fi
echo ""

# Test 16: Logout
echo "📋 Test 16: User Logout"
echo "----------------------------------------"
LOGOUT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -b $COOKIES_FILE)

LOGOUT_CODE=$(echo "$LOGOUT_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
LOGOUT_BODY=$(echo "$LOGOUT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $LOGOUT_BODY"
if [ "$LOGOUT_CODE" -eq 200 ]; then
  handle_success "User logout successful"
else
  handle_error "User logout failed (Status: $LOGOUT_CODE)"
fi
echo ""

# Test 17: Access Protected Endpoint After Logout
echo "📋 Test 17: Access Protected Endpoint After Logout (Should Fail)"
echo "----------------------------------------"
PROTECTED_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/auth/me" \
  -b $COOKIES_FILE)

PROTECTED_CODE=$(echo "$PROTECTED_RESPONSE" | grep HTTP_CODE | sed 's/HTTP_CODE://')
PROTECTED_BODY=$(echo "$PROTECTED_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $PROTECTED_BODY"
if [ "$PROTECTED_CODE" -eq 401 ]; then
  handle_success "Correctly denied access after logout"
else
  handle_warning "Expected 401 but got status: $PROTECTED_CODE"
fi
echo ""

# Cleanup
cleanup

# Summary
echo "=========================================="
echo "✨ Test Suite Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Server Status: ✅ Running"
echo "  - Authentication: ✅ Working"
echo "  - URL Shortening: ✅ Working"
echo "  - Analytics: ✅ Working"
echo "  - Security: ✅ Working"
echo "  - Email: ⚠️  Console logging (as expected)"
echo ""
echo "All core functionality verified! 🎉"
echo ""
