#!/bin/bash
###############################################################################
#  Temp script for testing some things
###############################################################################

set -e
trap 'exit 1' INT

echo 'Greetings from this temporary script!'
echo ${ACTIONS_ID_TOKEN_REQUEST_URL}
echo 'I hope that worked okay!'

echo "Getting the token"
export NPM_AUTH_TOKEN=$(curl -H "Authorization: bearer ${ACTIONS_ID_TOKEN_REQUEST_TOKEN}" "${ACTIONS_ID_TOKEN_REQUEST_URL}&audience=api://AzureADTokenExchange")

echo "Setting up npm"
echo "//registry.npmjs.org/:_authToken=\${NPM_AUTH_TOKEN}" >> $HOME/.npmrc 2> /dev/null
npm whoami
