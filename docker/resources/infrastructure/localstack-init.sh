# At the time of writing (Mar 2020) there are problems using cloudformation templates to initialise SQS queues (FIFO support)
awslocal cloudformation create-stack --template-body file:///docker-entrypoint-initaws.d/localstack-cfn.yml --stack-name localdev
