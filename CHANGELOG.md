## Unreleased (2020-06-23)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `gafl-webapp-service`
  - [#199](https://github.com/DEFRA/rod-licensing/pull/199) Add support for easy renewals to the web journey ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## Unreleased (2020-06-23)

#### :rocket: Enhancement

- `fulfilment-job`
  - [#200](https://github.com/DEFRA/rod-licensing/pull/200) Ensure errors uploading fulfilment data to S3 and FTP are properly trapped ([@sgardnerdell](https://github.com/sgardnerdell))
- Other
  - [#198](https://github.com/DEFRA/rod-licensing/pull/198) Revise git commit hooks to fix issues with sftp keys and secrets.env files ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-23)

#### :rocket: Enhancement

- [#198](https://github.com/DEFRA/rod-licensing/pull/198) Revise git commit hooks to fix issues with sftp keys and secrets.env files ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-22)

#### :rocket: Enhancement

- [#198](https://github.com/DEFRA/rod-licensing/pull/198) Revise git commit hooks to fix issues with sftp keys and secrets.env files ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-22)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  - [#196](https://github.com/DEFRA/rod-licensing/pull/196) Remove jest-each as this is natively supported by jest ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-22)

#### :rocket: Enhancement

- `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`
  - [#191](https://github.com/DEFRA/rod-licensing/pull/191) Implement fulfilment processor ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-16)

#### :bug: Bug Fix

- `gafl-webapp-service`
  - [#189](https://github.com/DEFRA/rod-licensing/pull/189) Static files failing to serve ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1

- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## Unreleased (2020-06-15)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#188](https://github.com/DEFRA/rod-licensing/pull/188) Moved dob to licence summary and update contact preferences to reflect latest design ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## Unreleased (2020-06-12)

#### :rocket: Enhancement

- `payment-mop-up-job`
  - [#182](https://github.com/DEFRA/rod-licensing/pull/182) Add docker support to the payment mopup service ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### :bug: Bug Fix

- [#181](https://github.com/DEFRA/rod-licensing/pull/181) Fix configuration error in POCL docker-compose definition ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 2

- [@graham-willis-druid](https://github.com/graham-willis-druid)
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-11)

#### :bug: Bug Fix

- [#181](https://github.com/DEFRA/rod-licensing/pull/181) Fix configuration error in POCL docker-compose definition ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## Unreleased (2020-06-11)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#180](https://github.com/DEFRA/rod-licensing/pull/180) Various display changes documented in IWTF-1104 ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.40 (2020-06-09)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  - [#175](https://github.com/DEFRA/rod-licensing/pull/175) Add support to authenticate users for easy renewals ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.39 (2020-06-08)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `gafl-webapp-service`, `payment-mop-up-job`, `sales-api-service`
  - [#171](https://github.com/DEFRA/rod-licensing/pull/171) Add mop-up job to reconcile payments with GOV.UK Pay ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.38 (2020-06-03)

#### :rocket: Enhancement

- `connectors-lib`, `dynamics-lib`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  - [#168](https://github.com/DEFRA/rod-licensing/pull/168) Add support for staging exceptions, pocl staging exceptions and improve docker support ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.37 (2020-05-29)

#### :rocket: Enhancement

- `connectors-lib`, `pocl-job`, `sales-api-service`
  - [#159](https://github.com/DEFRA/rod-licensing/pull/159) Add support to create, update, get and query payment journals ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.36 (2020-05-29)

#### :rocket: Enhancement

- `gafl-webapp-service`, `payment-mop-up-job`
  - [#157](https://github.com/DEFRA/rod-licensing/pull/157) Tighten CSP by using nonces for inline scripts, move survey page outside of the service, add initial payment mop-up package ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.35 (2020-05-28)

#### :rocket: Enhancement

- `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  - [#155](https://github.com/DEFRA/rod-licensing/pull/155) Add functionality to populate Dynamics POCL file entity with import details ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.33 (2020-05-26)

#### :rocket: Enhancement

- `connectors-lib`, `pocl-job`
  - [#152](https://github.com/DEFRA/rod-licensing/pull/152) Add FTP/S3 support to POCL and SFTP server to docker development infrastructure ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.31 (2020-05-22)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  - [#143](https://github.com/DEFRA/rod-licensing/pull/143) Add package to enable post office counter licence sales to be processed ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.30 (2020-05-12)

#### :rocket: Enhancement

- `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`, `sqs-receiver-service`
  - [#136](https://github.com/DEFRA/rod-licensing/pull/136) Integrate GOV.UK Pay into the web journey ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### :memo: Documentation

- [#129](https://github.com/DEFRA/rod-licensing/pull/129) Add guidance for building and running docker services locally ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 2

- [@graham-willis-druid](https://github.com/graham-willis-druid)
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.29 (2020-05-06)

#### :rocket: Enhancement

- `dynamics-lib`, `sales-api-service`
  - [#128](https://github.com/DEFRA/rod-licensing/pull/128) Update Sales API to relect latest changes to Dynamics schema ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.27 (2020-04-30)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#116](https://github.com/DEFRA/rod-licensing/pull/116) Integrate the GAFL frontend with the Sales API ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.26 (2020-04-29)

#### :rocket: Enhancement

- `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`, `sqs-receiver-service`
  - [#114](https://github.com/DEFRA/rod-licensing/pull/114) Resolve issue with permit/concession validator and complete post-payment validation ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.25 (2020-04-27)

#### :rocket: Enhancement

- `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`
  - [#113](https://github.com/DEFRA/rod-licensing/pull/113) Improve shared business-rules and add concession/permit validation ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.24 (2020-04-24)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#108](https://github.com/DEFRA/rod-licensing/pull/108) Added T&Cs and agree handler ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.23 (2020-04-24)

#### :rocket: Enhancement

- `dynamics-lib`, `sales-api-service`
  - [#107](https://github.com/DEFRA/rod-licensing/pull/107) Add dead letter queue handler and support for adding staging exceptions to Dynamics ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 2

- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.21 (2020-04-23)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#89](https://github.com/DEFRA/rod-licensing/pull/89) Add summary page: personal details functionality ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.20 (2020-04-22)

#### :rocket: Enhancement

- `dynamics-lib`, `sales-api-service`
  - [#99](https://github.com/DEFRA/rod-licensing/pull/99) Update to reflect latest change to Dynamics schema, add initial support for recurring payments and transaction history ([@sgardnerdell](https://github.com/sgardnerdell))

#### :bug: Bug Fix

- `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`, `sqs-receiver-service`
  - [#103](https://github.com/DEFRA/rod-licensing/pull/103) Correct repo name and terminology to rod-licensing ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.19 (2020-04-16)

#### :rocket: Enhancement

- `dynamics-lib`, `sales-api-service`
  - [#88](https://github.com/DEFRA/rod-licensing/pull/88) Separate endpoints for reference data entities and allow filtering on fields ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.17 (2020-04-15)

#### :rocket: Enhancement

- `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`, `sqs-receiver-service`
  - [#85](https://github.com/DEFRA/rod-licensing/pull/85) Initial version of the transaction processing pipeline to record new sales in Dynamics ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.16 (2020-04-14)

#### :rocket: Enhancement

- `business-rules-lib`, `gafl-webapp-service`
  - [#84](https://github.com/DEFRA/rod-licensing/pull/84) Add contact details pages to journey and integrate with business-rules-lib validators ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.15 (2020-04-08)

#### :rocket: Enhancement

- `business-rules-lib`
  - [#77](https://github.com/DEFRA/rod-licensing/pull/77) Add business-rules-lib package ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.14 (2020-04-02)

#### :rocket: Enhancement

- `sqs-receiver-service`
  - [#62](https://github.com/DEFRA/rod-licensing/pull/62) Update SQS receiver to handle all 2XX responses (inc 204 No Content) and use debug namespace ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.10 (2020-03-31)

#### :rocket: Enhancement

- `dynamics-lib`, `gafl-webapp-service`, `sqs-receiver-service`
  - [#55](https://github.com/DEFRA/rod-licensing/pull/55) Test coverage improvements ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.9 (2020-03-31)

#### :bug: Bug Fix

- `dynamics-lib`, `sales-api-service`
  - [#53](https://github.com/DEFRA/rod-licensing/pull/53) Remove es6 private fields for compatibility with sonarcloud and other improvements from static code analysis ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.7 (2020-03-30)

#### :rocket: Enhancement

- `dynamics-lib`, `sales-api-service`, `sqs-receiver-service`
  - [#44](https://github.com/DEFRA/rod-licensing/pull/44) Implement updates to reflect latest reference data schema and add local entity name support ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.5 (2020-03-24)

#### :rocket: Enhancement

- `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`, `sqs-receiver-service`
  - [#33](https://github.com/DEFRA/rod-licensing/pull/33) Add support to build and deploy using docker containers ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))
