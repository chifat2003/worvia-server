#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api/v1"

echo -e "${BLUE}=== WORVIA API TEST SUITE ===${NC}\n"

# Test 1: Register User
echo -e "${BLUE}[1] Testing POST /auth/register${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "John",
    "lastName": "Doe"
  }')

echo "Response: $REGISTER_RESPONSE"
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Registration failed - no token returned${NC}\n"
else
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo -e "Token: $TOKEN\n"
fi

# Test 2: Get authenticated user
echo -e "${BLUE}[2] Testing GET /auth/me (with token)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ME_RESPONSE"
if echo "$ME_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Get current user successful${NC}\n"
else
  echo -e "${RED}✗ Get current user failed${NC}\n"
fi

# Test 3: Get all users
echo -e "${BLUE}[3] Testing GET /users (all users)${NC}"
USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/users")

echo "Response: $USERS_RESPONSE"
if echo "$USERS_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Get all users successful${NC}\n"
else
  echo -e "${RED}✗ Get all users failed${NC}\n"
fi

# Test 4: Get specific user
echo -e "${BLUE}[4] Testing GET /users/1${NC}"
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/users/1")

echo "Response: $USER_RESPONSE"
if echo "$USER_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Get specific user successful${NC}\n"
else
  echo -e "${RED}✗ Get specific user failed${NC}\n"
fi

# Test 5: Search users
echo -e "${BLUE}[5] Testing GET /users/search?q=test${NC}"
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/users/search?q=test")

echo "Response: $SEARCH_RESPONSE"
if echo "$SEARCH_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Search users successful${NC}\n"
else
  echo -e "${RED}✗ Search users failed${NC}\n"
fi

echo -e "${BLUE}=== TEST COMPLETE ===${NC}"
