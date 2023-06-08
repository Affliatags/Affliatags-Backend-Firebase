curl_response_status_code () {
    [ $(printf "$1" | sed -n '1,1p' | grep "HTTP/1.1 $2" | wc -c) -gt 0 ]  && (printf "true") || (printf "false")
}