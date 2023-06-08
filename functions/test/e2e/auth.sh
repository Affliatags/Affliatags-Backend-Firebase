#!/bin/bash
for f in ../lib/*; do
   source "$f"
done

request () {
    readonly response=$(curl -i -s --request POST \
    --url http://127.0.0.1:3000/qr-id-2133c/us-central1/api/api/auth \
    --header 'Content-Type: application/json' \
    --data '{
        "username": "'"$1"'",
        "password": "'"$2"'"
    }')
    printf "$response"
}


$response="$(request 'test' 'Password@1')"

# printf "$response"
# readonly response_body=$(printf "$response" | tail -1 | tr -d "\n")
# readonly auth_token=$(printf "$response_body" | jq ".token" | tr -d '"')
# readonly status_code=$(printf "$response" | sed -n '1,1p' | grep "HTTP/1.1 201 Created")
# readonly content_type=$(printf "$response" | sed -n '3,3p' | grep "application/json; charset=utf-8")


suite "Authentication Endpoint"

it "Should have status code of 201" \
   "$(curl_response_status_code "$response" 201)"

it "Response content-type should be application/json" \
   "$(curl_response_content_type "$response" 'application/json; charset=utf-8')"

# printf "\n\n\033[0;35m[SUITE]\033[0m Authentication Endpoint\033[0m\n"

# printf "\033[0;36m[TEST]\033[0m Status code should be 201"
# if [ $(printf "$status_code" | wc -c) -gt 0 ]; then
#     printf "\033[0;32m ✓ PASSED\033[0m\n"
# else
#     printf "\033[0;31m ✘ FAILED\033[0m\n"
#     exit 1
# fi

# printf "\033[0;36m[TEST]\033[0m Response content-type should be application/json"
# if [ $(printf "$content_type" | wc -c) -gt 0 ]; then
#     printf "\033[0;32m ✓ PASSED\033[0m\n"
# else
#     printf "\033[0;31m ✘ FAILED\033[0m\n"
#     exit 1
# fi

# printf "\033[0;36m[TEST]\033[0m Response should not be empty"
# if [ $(printf "$response_body" | wc -c) -gt 0 ]; then
#     printf "\033[0;32m ✓ PASSED\033[0m\n"
# else
#     printf "\033[0;31m ✘ FAILED\033[0m\n"
#     exit 1
# fi

# jq --null-input \
#   --arg auth_token $auth_token \
#   '{"auth_token": $auth_token}' > "./test_vars.json"
# exit 0