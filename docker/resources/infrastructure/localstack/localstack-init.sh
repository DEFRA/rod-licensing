#!/bin/bash
###############################################################################
#  Localstack initialisation
###############################################################################
set -e
trap 'exit 1' INT

# Build a new cloudformation stack to initialise any resources in localstack-cfn.yml
awslocal cloudformation create-stack --template-body file:///docker-entrypoint-initaws.d/localstack-cfn.yml --stack-name localdev
