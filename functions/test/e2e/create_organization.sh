#!/bin/bash
test -f ./endpoints/auth.sh && ./endpoints/auth.sh || ./auth.sh | tail -n1 | tr -d '"'
test_vars=$(test -f ./endpoints/test_vars.json && ( cat ./endpoints/test_vars.json ) || ( cat ./test_vars.json ))
auth_token=$(printf "$test_vars" | jq ".auth_token")
organization_name=$(echo $RANDOM | md5sum | head -c 20)

e=$(printf "$(cat ./test_vars.json)" | jq '. += {"organization_name": "'"$organization_name"'"}') && echo "$e" > ./test_vars.json

readonly response=$(curl -i -s --request POST \
  --url http://127.0.0.1:3000/qr-id-2133c/us-central1/api/api/organization \
  --header 'Authorization: Bearer '"$auth_token"'' \
  --header 'Content-Type: application/json' \
  --data '{
	"organizationName": "'"$organization_name"'"
}')

readonly response_body=$(printf "$response" | tail -n1 | tr -d "\n")
readonly status_code=$(printf "$response" | sed -n '1,1p' | grep "HTTP/1.1 201 Created")


printf "\n\n\033[0;35m[SUITE]\033[0m Create Organization Endpoint\033[0m\n"

printf "\033[0;36m[TEST]\033[0m Status code should be 201"
if [ $(printf "$status_code" | wc -c) -gt 0 ]; then
    printf "\033[0;32m ✓ PASSED\033[0m\n"
else
    printf "\033[0;31m ✘ FAILED\033[0m\n"
    exit 1
fi

printf "\033[0;36m[TEST]\033[0m Response body should be empty"
if [ $(printf "$response_body" | wc -c) -gt 0 ]; then
    printf "\033[0;32m ✓ PASSED\033[0m\n"
else
    printf "\033[0;31m ✘ FAILED\033[0m\n"
    exit 1
fi

exit 0