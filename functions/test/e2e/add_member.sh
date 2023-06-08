#!/bin/bash
auth_token=$(test -f ./endpoints/auth.sh && ./endpoints/auth.sh || ./auth.sh | tail -n1 | tr -d '"')
organization_name=$(echo $RANDOM | md5sum | head -c 20)

readonly response=$(curl -i -s --request POST \
  --url http://127.0.0.1:3000/qr-id-2133c/us-central1/api/api/organizations/organization/members \
  --header 'Authorization: Bearer '"$auth_token"'' \
  --header 'Content-Type: application/json' \
  --data '{
	"username": "member",
	"password": "password",
	"permissions": {
		"tokensPerHour": 6,
		"accounts": {
			"CREATE": false,
			"READ": false,
			"UPDATE": false,
			"DELETE": false
		}
	},
	"organizationName": "'"$organization_name"'"
}')

readonly response_body=$(printf "$response" | tail -n1 | tr -d "\n")
readonly status_code=$(printf "$response" | sed -n '1,1p' | grep "HTTP/1.1 201 Created")


printf "\n\n\033[0;35m[SUITE]\033[0m Add Member Endpoint\033[0m\n"

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