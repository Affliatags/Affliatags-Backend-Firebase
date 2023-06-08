it () {
    test_description=$1
    success_condition=$2
    printf "\033[0;36m[TEST]\033[0m $test_description"
    if [ $success_condition = "true" ]; then
        printf "\033[0;32m ✓ PASSED\033[0m\n"
    else
        printf "\033[0;31m ✘ FAILED\033[0m\n"
    fi
}