#!/bin/bash
###############################################################################
#  Temp script for testing some things
###############################################################################

set -e
trap 'exit 1' INT

echo 'Greetings from this temporary script!'
echo ${ACTIONS_ID_TOKEN_REQUEST_URL}
echo 'I hope that worked okay!'
