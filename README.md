[![Build Status](https://api.travis-ci.org/DEFRA/rod-licensing.svg?branch=master)](https://travis-ci.org/DEFRA/rod-licensing)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=alert_status)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=security_rating)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=ncloc)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=coverage)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=bugs)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=code_smells)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=sqale_index)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_rod-licencing&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=DEFRA_rod-licencing)
[![Lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![Dependabot](https://api.dependabot.com/badges/status?host=github&repo=DEFRA/rod-licensing)](https://dependabot.com/)
[![GitHub issues](https://img.shields.io/github/issues/DEFRA/rod-licensing.svg)](https://github.com/DEFRA/rod-licensing/issues/)
[![Code size](https://img.shields.io/github/languages/code-size/DEFRA/rod-licensing.svg)]()
[![Repo size](https://img.shields.io/github/repo-size/DEFRA/rod-licensing.svg)]()
[![Licence](https://img.shields.io/badge/licence-OGLv3-blue.svg)](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3)

# Rod Licensing Digital Services

Mono-repo for the rod licensing digital services.

## Prerequisites

- Node v14+
- Docker v18.06.0+

## Cloning

Cloning via SSH from behind a firewall which blocks port 22:

```
git clone ssh://git@ssh.github.com:443/DEFRA/rod-licensing
```

## Using Lerna

This project uses [Lerna](https://lerna.js.org/) to simplify the management and versioning of multiple packages which comprise the rod licensing digital
service.

Running `npm install` in the root project will automatically run the `lerna bootstrap` command. The result is that any local packages which depend on
one another will be linked locally (using symbolic links).

Running `npm run lerna:clean` will remove all local node_modules.

Running `lernaupdate` will enter an interactive wizard to allow updates of each packages dependencies.

Running `lernaupdate --non-interactive --dependency "aws-sdk@latest"` will update the aws-sdk dependency in all packages which use it.

## Package structure

packages/

- [business-rules-lib](packages/business-rules-lib/README.md)
  > Shared business rules for the rod licensing services
- [dynamics-lib](packages/dynamics-lib/README.md)
  > Framework to consume the Dynamics ODATA Web API
- [gafl-webapp-service](packages/gafl-webapp-service/README.md)
  > "Get a Fishing Licence" front-end web-application
- [sales-api-service](packages/sales-api-service/README.md)
  > Sales API to support all sales channels and encapsulate integration with Dynamics
- [sqs-receiver-service](packages/sqs-receiver-service/README.md)
  > AWS SQS receiver service handles orchestration of SQS queues
- [govuk-pay-mopup-job](packages/govuk-pay-mopup-job/README.md)
  > Handles reconciliation of incomplete sales
- [pocl-job](packages/pocl-job/README.md)
  > Handles processing of post-office counter sales
- [fulfilment-job](packages/fulfilment-job/README.md)
  > Handles processing of licence fulfilment requirements

docker/

- infrastructure.yml
  > Local development infrastructure docker compose file
- service.yml
  > Service definitions docker compose file

## Contributing to this project

Please read our [contribution guidelines](CONTRIBUTING.md)

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
