curl_response_body () {
    [ $(printf "$1" | tail -1 | tr -d "\n") = $2 ] && (printf "true") || (printf "false")
}