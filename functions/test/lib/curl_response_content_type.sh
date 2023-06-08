curl_response_content_type () {
    [ $(printf "$1" | sed -n '3,3p' | grep "$2" | wc -c) -gt 0 ] && (printf "true") || (printf "false")
}