
## v1.64.0-rc.5 (2025-10-23)

#### :rocket: Enhancement
* [#2224](https://github.com/DEFRA/rod-licensing/pull/2224) Update npm deployment process ([@irisfaraway](https://github.com/irisfaraway))

#### :bug: Bug Fix
* [#2226](https://github.com/DEFRA/rod-licensing/pull/2226) Revert "Update npm deployment process (#2224)" ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.64.0-rc.3 (2025-10-14)

#### :rocket: Enhancement
* `connectors-lib`, `pocl-job`
  * [#2209](https://github.com/DEFRA/rod-licensing/pull/2209) Upgrade pocl job to use AWS SDK v3 ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.64.0-rc.2 (2025-10-06)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2215](https://github.com/DEFRA/rod-licensing/pull/2215) Recurring payment job should handle errors from await salesApi.processRPResult() ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.64.0-rc.1 (2025-10-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2201](https://github.com/DEFRA/rod-licensing/pull/2201) Create cancellation journey ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.64.0-rc.0 (2025-10-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2212](https://github.com/DEFRA/rod-licensing/pull/2212) Add missing reminder content to contact page on junior journey ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))


## v1.63.0-rc.18 (2025-09-18)

#### :bug: Bug Fix
* `recurring-payments-job`
  * [#2207](https://github.com/DEFRA/rod-licensing/pull/2207) Refactor for Airbrake integration ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.17 (2025-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2210](https://github.com/DEFRA/rod-licensing/pull/2210) Country capital letters ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.63.0-rc.16 (2025-09-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2205](https://github.com/DEFRA/rod-licensing/pull/2205) Capitals in address ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.63.0-rc.15 (2025-09-09)

#### :bug: Bug Fix
* `sales-api-service`
  * [#2204](https://github.com/DEFRA/rod-licensing/pull/2204) Allow RCP agreements to be created through easy renewal with later date ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.63.0-rc.14 (2025-09-04)

#### :bug: Bug Fix
* `sales-api-service`
  * [#2200](https://github.com/DEFRA/rod-licensing/pull/2200) Junior licence format ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.63.0-rc.13 (2025-08-29)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2203](https://github.com/DEFRA/rod-licensing/pull/2203) Don't cancel RP if checking payment status throws error ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.63.0-rc.12 (2025-08-27)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2198](https://github.com/DEFRA/rod-licensing/pull/2198) Setup Recurring Payments job to log to Errbit ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.11 (2025-08-21)

#### :rocket: Enhancement
* `connectors-lib`, `recurring-payments-job`, `sales-api-service`
  * [#2164](https://github.com/DEFRA/rod-licensing/pull/2164) Add function to cancel recurring payments in Sales API ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.63.0-rc.10 (2025-08-20)

#### :rocket: Enhancement
* `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`
  * [#2194](https://github.com/DEFRA/rod-licensing/pull/2194) Output version of service on startup ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.63.0-rc.9 (2025-08-15)

#### :rocket: Enhancement
* `connectors-lib`, `payment-mop-up-job`, `recurring-payments-job`
  * [#2183](https://github.com/DEFRA/rod-licensing/pull/2183) RCP - Clean up from previous jobs ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.8 (2025-08-15)

#### :bug: Bug Fix
* `recurring-payments-job`
  * [#2192](https://github.com/DEFRA/rod-licensing/pull/2192) Log when GOV.UK Pay cannot find an Agreement ID ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.7 (2025-08-14)

#### :bug: Bug Fix
* `sales-api-service`
  * [#2196](https://github.com/DEFRA/rod-licensing/pull/2196) Don't try to generate RCP record without data ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.63.0-rc.6 (2025-08-13)

#### :rocket: Enhancement
* `connectors-lib`, `payment-mop-up-job`, `sales-api-service`
  * [#2177](https://github.com/DEFRA/rod-licensing/pull/2177) Recurring payments mop up ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.63.0-rc.5 (2025-08-12)

#### :bug: Bug Fix
* `gafl-webapp-service`, `sales-api-service`
  * [#2193](https://github.com/DEFRA/rod-licensing/pull/2193) Fix bug with creating RPs in Web Sales journey ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.4 (2025-08-08)

#### :rocket: Enhancement
* `recurring-payments-job`, `sales-api-service`
  * [#2191](https://github.com/DEFRA/rod-licensing/pull/2191)  Amend RP job with RP id ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.63.0-rc.3 (2025-08-08)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2184](https://github.com/DEFRA/rod-licensing/pull/2184) Incorrect capitalistion of address in contact summary ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.63.0-rc.2 (2025-08-08)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2189](https://github.com/DEFRA/rod-licensing/pull/2189) Add additional card_details filtering ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.63.0-rc.1 (2025-08-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2187](https://github.com/DEFRA/rod-licensing/pull/2187) Make reference number entry box on renewal journey smaller ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.63.0-rc.0 (2025-08-07)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#2190](https://github.com/DEFRA/rod-licensing/pull/2190) Fix name of cancelledreasons optionset ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.62.0-rc.10 (2025-07-29)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2185](https://github.com/DEFRA/rod-licensing/pull/2185) Exclude card_brand from logs ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.62.0-rc.9 (2025-07-24)

#### :rocket: Enhancement
* `connectors-lib`, `recurring-payments-job`
  * [#2169](https://github.com/DEFRA/rod-licensing/pull/2169) RP job handles GOV.UK Pay error responses ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.62.0-rc.8 (2025-07-23)

#### :rocket: Enhancement
* `connectors-lib`, `sales-api-service`
  * [#2145](https://github.com/DEFRA/rod-licensing/pull/2145) Store bank card digits ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.62.0-rc.7 (2025-07-22)

#### :rocket: Enhancement
* `business-rules-lib`, `recurring-payments-job`
  * [#2148](https://github.com/DEFRA/rod-licensing/pull/2148) Recurring payments failed payments ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.62.0-rc.6 (2025-07-21)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2180](https://github.com/DEFRA/rod-licensing/pull/2180) Use blue favicon ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.62.0-rc.5 (2025-07-21)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2178](https://github.com/DEFRA/rod-licensing/pull/2178) Sanitise payment details in logging ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.62.0-rc.4 (2025-07-21)

#### :rocket: Enhancement
* `sales-api-service`
  * [#2179](https://github.com/DEFRA/rod-licensing/pull/2179) Set name of RecurringPayment record ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.62.0-rc.3 (2025-07-10)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2165](https://github.com/DEFRA/rod-licensing/pull/2165) Logs not diplsaying aws ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.62.0-rc.2 (2025-07-04)

#### :rocket: Enhancement
* `connectors-lib`, `sales-api-service`
  * [#2162](https://github.com/DEFRA/rod-licensing/pull/2162) Add endpoint for cancelling recurring payments ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.62.0-rc.1 (2025-07-02)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2176](https://github.com/DEFRA/rod-licensing/pull/2176) Remove Gov.UK Frontend dependency for the whole repo ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.62.0-rc.0 (2025-07-01)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2159](https://github.com/DEFRA/rod-licensing/pull/2159) Exclude completed recurring payments ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.61.0-rc.19 (2025-06-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2172](https://github.com/DEFRA/rod-licensing/pull/2172) Update GAFL Frontend to v5.10.2 ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.61.0-rc.18 (2025-06-20)

#### :rocket: Enhancement
* `connectors-lib`, `pocl-job`
  * [#2171](https://github.com/DEFRA/rod-licensing/pull/2171) AWS SDK v3 pocl job ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.61.0-rc.17 (2025-06-17)

#### :bug: Bug Fix
* `connectors-lib`, `dynamics-lib`, `sales-api-service`
  * [#2161](https://github.com/DEFRA/rod-licensing/pull/2161) Link recurring payments after new objects created ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.61.0-rc.16 (2025-06-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2170](https://github.com/DEFRA/rod-licensing/pull/2170) Allow customers to indicate concession eligibility ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.61.0-rc.15 (2025-06-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2166](https://github.com/DEFRA/rod-licensing/pull/2166) https://eaflood.atlassian.net/browse/IWTF-4392 ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.61.0-rc.14 (2025-06-03)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`
  * [#2138](https://github.com/DEFRA/rod-licensing/pull/2138) Implement fail screen for easy renewals journey Part 1 ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.61.0-rc.13 (2025-06-02)

#### :rocket: Enhancement
* [#2163](https://github.com/DEFRA/rod-licensing/pull/2163) Amend test:watch to automatically enable verbose and non-silent running ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.61.0-rc.12 (2025-05-30)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#2140](https://github.com/DEFRA/rod-licensing/pull/2140) Upgrade AWS SDK to v3 ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.61.0-rc.11 (2025-05-30)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#2158](https://github.com/DEFRA/rod-licensing/pull/2158) Upgrade to v20 of node ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))



## v1.61.0-rc.8 (2025-05-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2157](https://github.com/DEFRA/rod-licensing/pull/2157) Remove logging code for new prices bug ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.61.0-rc.7 (2025-05-15)

#### :rocket: Enhancement
* `connectors-lib`, `sales-api-service`
  * [#2155](https://github.com/DEFRA/rod-licensing/pull/2155) Add link-recurring-payments endpoint ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.61.0-rc.6 (2025-05-15)

#### :bug: Bug Fix
* `connectors-lib`, `gafl-webapp-service`
  * [#2152](https://github.com/DEFRA/rod-licensing/pull/2152) Remove date picker from start kind screen ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.61.0-rc.5 (2025-05-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2151](https://github.com/DEFRA/rod-licensing/pull/2151) RCP confirmation content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.61.0-rc.4 (2025-05-13)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2135](https://github.com/DEFRA/rod-licensing/pull/2135) Recurring payments logging ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.61.0-rc.3 (2025-05-02)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#2150](https://github.com/DEFRA/rod-licensing/pull/2150) Fix capitalisation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.61.0-rc.2 (2025-05-02)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#2149](https://github.com/DEFRA/rod-licensing/pull/2149) Fix field names in test ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.61.0-rc.1 (2025-04-28)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2139](https://github.com/DEFRA/rod-licensing/pull/2139) Card digits dynamics lib ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.61.0-rc.0 (2025-04-24)

#### :rocket: Enhancement
* `sales-api-service`
  * [#2144](https://github.com/DEFRA/rod-licensing/pull/2144) Add validation schemas to recurring payment routes ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.60.0-rc.4 (2025-04-01)

#### :rocket: Enhancement
* `connectors-lib`, `recurring-payments-job`, `sales-api-service`
  * [#2119](https://github.com/DEFRA/rod-licensing/pull/2119) RP Job save permission ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.60.0-rc.3 (2025-04-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2137](https://github.com/DEFRA/rod-licensing/pull/2137) Auto amend newsletter ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.60.0-rc.2 (2025-04-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2136](https://github.com/DEFRA/rod-licensing/pull/2136) Ability to turn off rcp ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.60.0-rc.1 (2025-03-20)

#### :rocket: Enhancement
* `connectors-lib`
  * [#2121](https://github.com/DEFRA/rod-licensing/pull/2121) HTTP Request Batcher ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.60.0-rc.0 (2025-03-20)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#2132](https://github.com/DEFRA/rod-licensing/pull/2132) RCP cancellation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.59.0-rc.9 (2025-02-18)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2125](https://github.com/DEFRA/rod-licensing/pull/2125) Missing Welsh from Licence-type selection page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.59.0-rc.8 (2025-02-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2123](https://github.com/DEFRA/rod-licensing/pull/2123) Clarify RP agreement status when first payment does not go through ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.59.0-rc.7 (2025-02-18)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2126](https://github.com/DEFRA/rod-licensing/pull/2126) Add NextRecurringPayment to RecurringPayment entity ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.59.0-rc.6 (2025-02-18)

#### :rocket: Enhancement
* Other
  * [#2127](https://github.com/DEFRA/rod-licensing/pull/2127) Update GitHub Actions build script ([@lailien3](https://github.com/lailien3))
* `recurring-payments-job`
  * [#2124](https://github.com/DEFRA/rod-licensing/pull/2124) Amend recurring payment transaction to contain reference to recurring payment ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.59.0-rc.5 (2025-02-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2120](https://github.com/DEFRA/rod-licensing/pull/2120) CORRECTIONS - Implement new content for licence selection page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.59.0-rc.4 (2025-02-03)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2110](https://github.com/DEFRA/rod-licensing/pull/2110) RP job set status of payment request ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.59.0-rc.3 (2025-01-31)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2116](https://github.com/DEFRA/rod-licensing/pull/2116) Licence selection new content update ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.59.0-rc.2 (2025-01-31)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2108](https://github.com/DEFRA/rod-licensing/pull/2108) Date validation easy renewals ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.59.0-rc.1 (2025-01-31)

#### :rocket: Enhancement
* `sales-api-service`
  * [#2113](https://github.com/DEFRA/rod-licensing/pull/2113) Validate RP Request ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.59.0-rc.0 (2025-01-31)

#### :rocket: Enhancement
* `dynamics-lib`, `sales-api-service`
  * [#2080](https://github.com/DEFRA/rod-licensing/pull/2080) Easy renewal query ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.58.0-rc.13 (2025-01-22)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2112](https://github.com/DEFRA/rod-licensing/pull/2112) Get id from payment creation request ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.58.0-rc.12 (2025-01-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2111](https://github.com/DEFRA/rod-licensing/pull/2111) Check recurring status based on transaction ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.58.0-rc.11 (2025-01-16)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#2109](https://github.com/DEFRA/rod-licensing/pull/2109) Recurring payment job sends payment requests to GOV.UK Pay ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.58.0-rc.10 (2025-01-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2090](https://github.com/DEFRA/rod-licensing/pull/2090) Mobile phone links ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.58.0-rc.9 (2025-01-15)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2101](https://github.com/DEFRA/rod-licensing/pull/2101) Move continue button to below the pricing summary ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.8 (2025-01-14)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2106](https://github.com/DEFRA/rod-licensing/pull/2106) Capitalising Date Entry Fields ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.7 (2025-01-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2107](https://github.com/DEFRA/rod-licensing/pull/2107) Added Welsh to Missing Address Error ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.6 (2025-01-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2105](https://github.com/DEFRA/rod-licensing/pull/2105) Add Welsh to Hidden Date Picker Text ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.5 (2025-01-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2104](https://github.com/DEFRA/rod-licensing/pull/2104) Welsh Missing From Payment Errors ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.4 (2025-01-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2102](https://github.com/DEFRA/rod-licensing/pull/2102) Add Missing Welsh to Newsletter Page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.3 (2025-01-03)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2103](https://github.com/DEFRA/rod-licensing/pull/2103) Incorrect Link to Fisheries Report ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.58.0-rc.2 (2024-12-23)

#### :rocket: Enhancement
* `dynamics-lib`, `gafl-webapp-service`
  * [#2096](https://github.com/DEFRA/rod-licensing/pull/2096) Update order complete page RCP logic ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.58.0-rc.0 (2024-12-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2098](https://github.com/DEFRA/rod-licensing/pull/2098) New price increase ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#2099](https://github.com/DEFRA/rod-licensing/pull/2099) Payment edge case 2025 ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.57.0-rc.12 (2024-12-13)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2095](https://github.com/DEFRA/rod-licensing/pull/2095) Missing inline error on renewals id page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.57.0-rc.11 (2024-12-13)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2091](https://github.com/DEFRA/rod-licensing/pull/2091) Update activity in CRM ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- Nabeel Amir ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## v1.57.0-rc.10 (2024-12-13)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2094](https://github.com/DEFRA/rod-licensing/pull/2094) Licence to start error not in error summary ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.57.0-rc.9 (2024-12-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2093](https://github.com/DEFRA/rod-licensing/pull/2093) Fix DOB message in Welsh ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.57.0-rc.8 (2024-12-12)

#### :bug: Bug Fix
* `sales-api-service`
  * [#2092](https://github.com/DEFRA/rod-licensing/pull/2092) Fix RP creation bug ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.57.0-rc.6 (2024-12-10)

#### :rocket: Enhancement
* `dynamics-lib`, `sales-api-service`
  * [#2081](https://github.com/DEFRA/rod-licensing/pull/2081) Create RP Record in CRM ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.57.0-rc.5 (2024-12-10)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2088](https://github.com/DEFRA/rod-licensing/pull/2088) Change length link junior licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.57.0-rc.4 (2024-12-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2022](https://github.com/DEFRA/rod-licensing/pull/2022) Apply more specific date error messages ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.57.0-rc.3 (2024-12-06)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`
  * [#2082](https://github.com/DEFRA/rod-licensing/pull/2082) Rename createRecurringPayment to clarify it creates agreements ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.57.0-rc.2 (2024-12-04)

#### :rocket: Enhancement
* `pocl-job`
  * [#2085](https://github.com/DEFRA/rod-licensing/pull/2085) FTP POCL references ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.57.0-rc.1 (2024-11-29)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#2086](https://github.com/DEFRA/rod-licensing/pull/2086) RCP fails ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.57.0-rc.0 (2024-11-29)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#2075](https://github.com/DEFRA/rod-licensing/pull/2075) RCP job fails locally ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.6 (2024-11-25)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#2070](https://github.com/DEFRA/rod-licensing/pull/2070) Remove ftp image and build ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.55.0-rc.5 (2024-11-25)

#### :rocket: Enhancement
* `fulfilment-job`, `pocl-job`
  * [#2064](https://github.com/DEFRA/rod-licensing/pull/2064) Remove ftp functionality ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.55.0-rc.4 (2024-11-21)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#2074](https://github.com/DEFRA/rod-licensing/pull/2074) Add agreement_id to existing GOV.UK Pay request ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.55.0-rc.3 (2024-11-21)

#### :rocket: Enhancement
* [#2078](https://github.com/DEFRA/rod-licensing/pull/2078) Set-output removed from versioning script ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.55.0-rc.2 (2024-11-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2077](https://github.com/DEFRA/rod-licensing/pull/2077) Change links for three rod licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.55.0-rc.1 (2024-11-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2079](https://github.com/DEFRA/rod-licensing/pull/2079) Licence summary licence type capitals ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.55.0-rc.0 (2024-11-13)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2072](https://github.com/DEFRA/rod-licensing/pull/2072) Create activity in CRM ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- Nabeel Amir ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

## v1.55.0-rc.6 (2024-11-25)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#2070](https://github.com/DEFRA/rod-licensing/pull/2070) Remove ftp image and build ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.5 (2024-11-25)

#### :rocket: Enhancement
* `fulfilment-job`, `pocl-job`
  * [#2064](https://github.com/DEFRA/rod-licensing/pull/2064) Remove ftp functionality ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.4 (2024-11-21)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#2074](https://github.com/DEFRA/rod-licensing/pull/2074) Add agreement_id to existing GOV.UK Pay request ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.55.0-rc.3 (2024-11-21)

#### :rocket: Enhancement
* [#2078](https://github.com/DEFRA/rod-licensing/pull/2078) Set-output removed from versioning script ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.2 (2024-11-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2077](https://github.com/DEFRA/rod-licensing/pull/2077) Change links for three rod licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.1 (2024-11-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2079](https://github.com/DEFRA/rod-licensing/pull/2079) Licence summary licence type capitals ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.55.0-rc.0 (2024-11-13)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2072](https://github.com/DEFRA/rod-licensing/pull/2072) Create activity in CRM ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- Nabeel Amir ([@nabeelamir-defra](https://github.com/nabeelamir-defra))






## v1.51.0-rc.5 (2024-11-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2073](https://github.com/DEFRA/rod-licensing/pull/2073) Building tag error ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.51.0-rc.4 (2024-11-07)

#### :rocket: Enhancement
* `gafl-webapp-service`, `recurring-payments-job`, `sales-api-service`
  * [#2069](https://github.com/DEFRA/rod-licensing/pull/2069) Change docker to not install dev dependency ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.51.0-rc.2 (2024-11-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2071](https://github.com/DEFRA/rod-licensing/pull/2071) Fix bug where transaction id is not recognised ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.51.0-rc.1 (2024-10-29)

#### :rocket: Enhancement
* `connectors-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#2050](https://github.com/DEFRA/rod-licensing/pull/2050) Create rcp agreement with GOV.UK pay ([@ScottDormand96](https://github.com/ScottDormand96))
* `gafl-webapp-service`
  * [#2030](https://github.com/DEFRA/rod-licensing/pull/2030) Content amendments to payment summary ([@lailien3](https://github.com/lailien3))
* Other
  * [#2060](https://github.com/DEFRA/rod-licensing/pull/2060) Update dependencies in package-lock ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 2
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.51.0-rc.0 (2024-10-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2067](https://github.com/DEFRA/rod-licensing/pull/2067) Payment complete 10 days ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#2066](https://github.com/DEFRA/rod-licensing/pull/2066) Update content to 10 days ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.50.0-rc.10 (2024-10-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2061](https://github.com/DEFRA/rod-licensing/pull/2061) Uninstall pdfmake ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.50.0-rc.9 (2024-10-09)

#### :bug: Bug Fix
* [#2063](https://github.com/DEFRA/rod-licensing/pull/2063) Fix localstack config ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.50.0-rc.8 (2024-09-25)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2054](https://github.com/DEFRA/rod-licensing/pull/2054) Correcting styling for RCP T&C headers ([@lailien3](https://github.com/lailien3))

#### Committers: 2
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.50.0-rc.7 (2024-09-18)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2051](https://github.com/DEFRA/rod-licensing/pull/2051) Add missing export for RCR angler login ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.50.0-rc.6 (2024-09-18)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#2049](https://github.com/DEFRA/rod-licensing/pull/2049) Add query to allow angler to login in to RCR ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.50.0-rc.5 (2024-09-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2045](https://github.com/DEFRA/rod-licensing/pull/2045) Display Recurring payment terms and conditions ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.50.0-rc.4 (2024-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2047](https://github.com/DEFRA/rod-licensing/pull/2047) Fulfilment page deselecting post ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.50.0-rc.3 (2024-09-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2046](https://github.com/DEFRA/rod-licensing/pull/2046) Change link on address page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.50.0-rc.2 (2024-09-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2040](https://github.com/DEFRA/rod-licensing/pull/2040) Amend Change link in Easy Renew Journey ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.50.0-rc.1 (2024-09-13)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2039](https://github.com/DEFRA/rod-licensing/pull/2039) RCP T&C - Shrink Subheadings ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))

## v1.50.0-rc.0 (2024-09-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2043](https://github.com/DEFRA/rod-licensing/pull/2043) Update postal fulfilment information banner ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- laila aleissa ([@lailien3](https://github.com/lailien3))


## v1.49.0-rc.11 (2024-09-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2036](https://github.com/DEFRA/rod-licensing/pull/2036) Save multiple times cookies page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.49.0-rc.9 (2024-09-02)

#### :bug: Bug Fix
* `dynamics-lib`, `sales-api-service`
  * [#2029](https://github.com/DEFRA/rod-licensing/pull/2029) Amend transaction creation payload ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.49.0-rc.8 (2024-09-02)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`
  * [#2028](https://github.com/DEFRA/rod-licensing/pull/2028) Prevent copy and paste values ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.49.0-rc.7 (2024-08-22)

#### :bug: Bug Fix
* `recurring-payments-job`
  * [#2024](https://github.com/DEFRA/rod-licensing/pull/2024) RCP Job Fails Locally ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.49.0-rc.6 (2024-08-20)

#### :rocket: Enhancement
* `recurring-payments-job`, `sales-api-service`
  * [#1983](https://github.com/DEFRA/rod-licensing/pull/1983) Recurring payment job concessions ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.49.0-rc.4 (2024-08-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2020](https://github.com/DEFRA/rod-licensing/pull/2020) Cookies page functionality ([@ScottDormand96](https://github.com/ScottDormand96))
* `business-rules-lib`
  * [#1995](https://github.com/DEFRA/rod-licensing/pull/1995) Copy and paste into input fields ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.49.0-rc.3 (2024-08-16)

#### :bug: Bug Fix
* `business-rules-lib`
  * [#2021](https://github.com/DEFRA/rod-licensing/pull/2021) Export date validations ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.49.0-rc.1 (2024-08-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2015](https://github.com/DEFRA/rod-licensing/pull/2015) Minor Content Change To licence-details Page ([@lailien3](https://github.com/lailien3))
  * [#2014](https://github.com/DEFRA/rod-licensing/pull/2014) Minor Content Change To start-kind Page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.49.0-rc.0 (2024-08-15)

#### :rocket: Enhancement
* `business-rules-lib`
  * [#2010](https://github.com/DEFRA/rod-licensing/pull/2010) Add new validators for date fields ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.48.0-rc.8 (2024-08-13)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2018](https://github.com/DEFRA/rod-licensing/pull/2018) Links open new tab ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.48.0-rc.5 (2024-08-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2011](https://github.com/DEFRA/rod-licensing/pull/2011) Remove analytics button ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2012](https://github.com/DEFRA/rod-licensing/pull/2012) Correcting date in statement ([@lailien3](https://github.com/lailien3))

#### Committers: 2
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
- [@lailien3](https://github.com/lailien3)

## v1.48.0-rc.4 (2024-08-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#2007](https://github.com/DEFRA/rod-licensing/pull/2007) Updating Cookies Policy Page to Include GA4 Analytics ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.48.0-rc.3 (2024-08-08)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2008](https://github.com/DEFRA/rod-licensing/pull/2008) Correcting Cookie Banner Service Name ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.48.0-rc.2 (2024-08-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2009](https://github.com/DEFRA/rod-licensing/pull/2009) Fix ages reference ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.48.0-rc.0 (2024-08-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1989](https://github.com/DEFRA/rod-licensing/pull/1989) Hide RCP option for Junior licence purchases ([@lailien3](https://github.com/lailien3))
  * [#2006](https://github.com/DEFRA/rod-licensing/pull/2006) Revising accessibility statement ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)


## v1.47.0-rc.18 (2024-07-23)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2002](https://github.com/DEFRA/rod-licensing/pull/2002) content security policy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.47.0-rc.17 (2024-07-19)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#2000](https://github.com/DEFRA/rod-licensing/pull/2000) "Cost" is missing from the licence summary page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.47.0-rc.16 (2024-07-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1992](https://github.com/DEFRA/rod-licensing/pull/1992) Hyperlinks on privacy policy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.47.0-rc.15 (2024-07-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1985](https://github.com/DEFRA/rod-licensing/pull/1985) Email/Text display junior ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.47.0-rc.14 (2024-07-10)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1994](https://github.com/DEFRA/rod-licensing/pull/1994) Remove Americanisation ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.47.0-rc.13 (2024-07-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1988](https://github.com/DEFRA/rod-licensing/pull/1988) Remove unused local data ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)


## v1.47.0-rc.11 (2024-06-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1986](https://github.com/DEFRA/rod-licensing/pull/1986) Update privacy policy ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.47.0-rc.10 (2024-06-27)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1966](https://github.com/DEFRA/rod-licensing/pull/1966) Incorrect details on Welsh payment screen ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.47.0-rc.9 (2024-06-26)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#1982](https://github.com/DEFRA/rod-licensing/pull/1982) remove full stop ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.47.0-rc.8 (2024-06-26)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1984](https://github.com/DEFRA/rod-licensing/pull/1984) Header service name lacks capitalisation. ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.47.0-rc.7 (2024-06-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1979](https://github.com/DEFRA/rod-licensing/pull/1979) GTM activiated by user ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.47.0-rc.5 (2024-06-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1980](https://github.com/DEFRA/rod-licensing/pull/1980) Change behaviour revisiting mobile/email ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1976](https://github.com/DEFRA/rod-licensing/pull/1976) Update cookies banner for new analytics ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.47.0-rc.3 (2024-06-17)

#### :rocket: Enhancement
* `recurring-payments-job`, `sales-api-service`
  * [#1957](https://github.com/DEFRA/rod-licensing/pull/1957) Recurring payments job sets up new permissions in DynamoDb ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.47.0-rc.0 (2024-06-06)

#### :rocket: Enhancement
* `connectors-lib`
  * [#1978](https://github.com/DEFRA/rod-licensing/pull/1978) Add new route to Sales API connector ([@irisfaraway](https://github.com/irisfaraway))
* `dynamics-lib`
  * [#1977](https://github.com/DEFRA/rod-licensing/pull/1977) Add new query based on full reference number ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.46.0-rc.11 (2024-06-04)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `recurring-payments-job`, `sales-api-service`, `sqs-receiver-service`
  * [#1974](https://github.com/DEFRA/rod-licensing/pull/1974) update lerna ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.46.0-rc.9 (2024-06-03)

#### :bug: Bug Fix
* [#1972](https://github.com/DEFRA/rod-licensing/pull/1972) dependencies error ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 2
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
- [@lailien3](https://github.com/lailien3)


## v1.46.0-rc.7 (2024-06-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1969](https://github.com/DEFRA/rod-licensing/pull/1969) Corrected accessibility statement ([@lailien3](https://github.com/lailien3))

#### :memo: Documentation
* [#1953](https://github.com/DEFRA/rod-licensing/pull/1953) Update Node version prerequisite in README ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.46.0-rc.6 (2024-05-28)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1949](https://github.com/DEFRA/rod-licensing/pull/1949) Licence conditions match Notify ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* [#1965](https://github.com/DEFRA/rod-licensing/pull/1965) github actions error ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))





## v1.46.0-rc.1 (2024-05-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1958](https://github.com/DEFRA/rod-licensing/pull/1958) Updating the accessibility statement. ([@lailien3](https://github.com/lailien3))
  * [#1960](https://github.com/DEFRA/rod-licensing/pull/1960) Amend Welsh title service header to match through out the service ([@lailien3](https://github.com/lailien3))
  * [#1961](https://github.com/DEFRA/rod-licensing/pull/1961) Updating recurring card payment consent page ([@lailien3](https://github.com/lailien3))
  * [#1962](https://github.com/DEFRA/rod-licensing/pull/1962) Updating recurring card payment terms & conditions page ([@lailien3](https://github.com/lailien3))
  * [#1963](https://github.com/DEFRA/rod-licensing/pull/1963) Amend privacy policy page for recurring card payments ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.46.0-rc.0 (2024-05-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1955](https://github.com/DEFRA/rod-licensing/pull/1955) Remove online cancellation from recurring payments terms ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.45.0-rc.4 (2024-05-10)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#1951](https://github.com/DEFRA/rod-licensing/pull/1951) Fix error generating fulfilment file after CRM fulfilment requests ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.45.0-rc.3 (2024-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1952](https://github.com/DEFRA/rod-licensing/pull/1952) Update footer for licence and crown copyright ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.45.0-rc.2 (2024-05-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1947](https://github.com/DEFRA/rod-licensing/pull/1947) Amend refund policy page ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.45.0-rc.1 (2024-04-23)

#### :rocket: Enhancement
* `recurring-payments-job`
  * [#1946](https://github.com/DEFRA/rod-licensing/pull/1946) RP job local failure ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.45.0-rc.0 (2024-04-22)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1945](https://github.com/DEFRA/rod-licensing/pull/1945) Fixing privacy title discrepancy ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)


## v1.44.0-rc.13 (2024-04-04)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1942](https://github.com/DEFRA/rod-licensing/pull/1942) https://eaflood.atlassian.net/browse/IWTF-4063 ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.44.0-rc.12 (2024-04-03)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `recurring-payments-job`, `sales-api-service`
  * [#1909](https://github.com/DEFRA/rod-licensing/pull/1909) Implement recurring payments ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.44.0-rc.11 (2024-03-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1939](https://github.com/DEFRA/rod-licensing/pull/1939) Associating hint text with the field set ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.44.0-rc.10 (2024-03-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1940](https://github.com/DEFRA/rod-licensing/pull/1940) Ensuring page titles meet WCAG 2.1 criteria ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.44.0-rc.9 (2024-03-25)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1930](https://github.com/DEFRA/rod-licensing/pull/1930) Adding in “Error” prefix in titles ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)


## v1.44.0-rc.7 (2024-03-22)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1934](https://github.com/DEFRA/rod-licensing/pull/1934) Fix broken acceptance tests ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.44.0-rc.5 (2024-03-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1937](https://github.com/DEFRA/rod-licensing/pull/1937) Ensuring page titles meet WCAG 2.1 criteria ([@lailien3](https://github.com/lailien3))
  * [#1938](https://github.com/DEFRA/rod-licensing/pull/1938) Remove "Continue" button from within the fieldset ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.44.0-rc.4 (2024-03-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1925](https://github.com/DEFRA/rod-licensing/pull/1925) Keyboard focus inconsistency ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.44.0-rc.3 (2024-03-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1932](https://github.com/DEFRA/rod-licensing/pull/1932) NCCC users not see RCP option ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.44.0-rc.2 (2024-03-19)

#### :rocket: Enhancement
* `dynamics-lib`, `sales-api-service`
  * [#1935](https://github.com/DEFRA/rod-licensing/pull/1935) Update dyncamics lib recurring payment ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.44.0-rc.0 (2024-03-14)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1926](https://github.com/DEFRA/rod-licensing/pull/1926) Warning message assistive text ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1915](https://github.com/DEFRA/rod-licensing/pull/1915) Cant access new prices page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.43.0-rc.3 (2024-03-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1914](https://github.com/DEFRA/rod-licensing/pull/1914) Content to cover price change edge case ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1922](https://github.com/DEFRA/rod-licensing/pull/1922) Renewing a licence starts a day early ([@jaucourt](https://github.com/jaucourt))

#### Committers: 2
- Phil Benson ([@jaucourt](https://github.com/jaucourt))
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.43.0-rc.2 (2024-02-29)

#### :rocket: Enhancement
* `business-rules-lib`, `sales-api-service`
  * [#1904](https://github.com/DEFRA/rod-licensing/pull/1904) Check if the fulfilment switchover date has passed when processing transactions ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.43.0-rc.1 (2024-02-29)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1920](https://github.com/DEFRA/rod-licensing/pull/1920) Improving usability to page title to meet WGAC 2.1 criteria ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.43.0-rc.0 (2024-02-29)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1919](https://github.com/DEFRA/rod-licensing/pull/1919) Current day is leap year start licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.42.0-rc.2 (2024-02-26)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1916](https://github.com/DEFRA/rod-licensing/pull/1916) Hiding and revealing content on licence type selection ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)


## v1.42.0-rc.0 (2024-02-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1913](https://github.com/DEFRA/rod-licensing/pull/1913) Accessibility, bilingual toggle toggle ([@lailien3](https://github.com/lailien3))

#### Committers: 1
- [@lailien3](https://github.com/lailien3)

## v1.41.0 (2024-02-21)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1912](https://github.com/DEFRA/rod-licensing/pull/1912) SEMVER - PATCH: Release v1.40.1 ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))




## v1.40.0-rc.0 (2024-02-14)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1905](https://github.com/DEFRA/rod-licensing/pull/1905) Fix service for acceptance tests ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.39.0-rc.14 (2024-02-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1903](https://github.com/DEFRA/rod-licensing/pull/1903) Code smells on develop ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.13 (2024-02-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1901](https://github.com/DEFRA/rod-licensing/pull/1901) Acceptance tests ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.12 (2024-02-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1900](https://github.com/DEFRA/rod-licensing/pull/1900) RCP Terms and Conditions page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.11 (2024-02-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1878](https://github.com/DEFRA/rod-licensing/pull/1878) Recurring payment terms and conditions welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.10 (2024-02-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1898](https://github.com/DEFRA/rod-licensing/pull/1898) Confirmation display recurring payment ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.9 (2024-02-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1897](https://github.com/DEFRA/rod-licensing/pull/1897) Confirmation page content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.39.0-rc.8 (2024-01-26)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1881](https://github.com/DEFRA/rod-licensing/pull/1881) Price on order confirmation page incorrect ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.39.0-rc.7 (2024-01-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1880](https://github.com/DEFRA/rod-licensing/pull/1880) Update dependencies ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.39.0-rc.6 (2024-01-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1860](https://github.com/DEFRA/rod-licensing/pull/1860) Welsh - confirmation page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.39.0-rc.4 (2024-01-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1862](https://github.com/DEFRA/rod-licensing/pull/1862) Recurring payment confirmation content ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1854](https://github.com/DEFRA/rod-licensing/pull/1854) Recurring payment terms and conditions page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.39.0-rc.1 (2024-01-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1861](https://github.com/DEFRA/rod-licensing/pull/1861) Update price increase page ([@jaucourt](https://github.com/jaucourt))

#### :bug: Bug Fix
* `business-rules-lib`, `sales-api-service`
  * [#1853](https://github.com/DEFRA/rod-licensing/pull/1853) Fix wrong price in CRM ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.39.0-rc.0 (2024-01-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1849](https://github.com/DEFRA/rod-licensing/pull/1849) Confirmation content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.38.0-rc.14 (2024-01-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1855](https://github.com/DEFRA/rod-licensing/pull/1855) Confirmation method reflow content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.13 (2024-01-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1856](https://github.com/DEFRA/rod-licensing/pull/1856) Update English language text about receiving licence ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.38.0-rc.12 (2024-01-11)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1847](https://github.com/DEFRA/rod-licensing/pull/1847) Fix typos in Welsh translation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.38.0-rc.11 (2024-01-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1845](https://github.com/DEFRA/rod-licensing/pull/1845) Recurring Payment not for BOBO ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.10 (2024-01-10)

#### :bug: Bug Fix
* `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `recurring-payments-job`, `sales-api-service`
  * [#1852](https://github.com/DEFRA/rod-licensing/pull/1852) Remove rp job ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.38.0-rc.8 (2024-01-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1846](https://github.com/DEFRA/rod-licensing/pull/1846) How recieve licence update (1/8 day) ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1848](https://github.com/DEFRA/rod-licensing/pull/1848) Content reflow ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.7 (2024-01-03)

#### :rocket: Enhancement
* `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `recurring-payments-job`, `sales-api-service`
  * [#1816](https://github.com/DEFRA/rod-licensing/pull/1816) Recurring payments ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.6 (2023-12-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1841](https://github.com/DEFRA/rod-licensing/pull/1841) Permit cost increase ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.38.0-rc.5 (2023-12-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1844](https://github.com/DEFRA/rod-licensing/pull/1844) Recurring payment agreement ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.4 (2023-12-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1839](https://github.com/DEFRA/rod-licensing/pull/1839) Recurring payment agreement page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.3 (2023-12-20)

#### :bug: Bug Fix
* `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  * [#1843](https://github.com/DEFRA/rod-licensing/pull/1843) Fix code smells ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.38.0-rc.2 (2023-12-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1842](https://github.com/DEFRA/rod-licensing/pull/1842) Update text referring to physical licences ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.38.0-rc.1 (2023-12-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1836](https://github.com/DEFRA/rod-licensing/pull/1836) Welsh - Payment Options ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.38.0-rc.0 (2023-12-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1835](https://github.com/DEFRA/rod-licensing/pull/1835) Accessibility - reflow of content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.37.0-rc.15 (2023-12-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1837](https://github.com/DEFRA/rod-licensing/pull/1837) Payment options screen error ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.37.0-rc.14 (2023-12-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1833](https://github.com/DEFRA/rod-licensing/pull/1833) Banner title welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.37.0-rc.13 (2023-12-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1824](https://github.com/DEFRA/rod-licensing/pull/1824) Recurring payments payment options ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.37.0-rc.11 (2023-12-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1834](https://github.com/DEFRA/rod-licensing/pull/1834) Accessibility focus order ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1828](https://github.com/DEFRA/rod-licensing/pull/1828) console error contact page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.37.0-rc.8 (2023-11-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1827](https://github.com/DEFRA/rod-licensing/pull/1827) Welsh - encourage users digital reminder ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1830](https://github.com/DEFRA/rod-licensing/pull/1830) Banner for end licence details in welsh ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1832](https://github.com/DEFRA/rod-licensing/pull/1832) Accessibility - where send licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.37.0-rc.7 (2023-11-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1826](https://github.com/DEFRA/rod-licensing/pull/1826) Remove phone from content in text message option ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.37.0-rc.6 (2023-11-22)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1825](https://github.com/DEFRA/rod-licensing/pull/1825) Add necessary domains for GA4 to Content Policy ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))




## v1.37.0-rc.2 (2023-11-09)

#### :rocket: Enhancement
* [#1815](https://github.com/DEFRA/rod-licensing/pull/1815) Update critical dependencies ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.37.0-rc.1 (2023-11-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1811](https://github.com/DEFRA/rod-licensing/pull/1811) Insert Google Tag Manager snippet in template ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.36.0-rc.11 (2023-10-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1804](https://github.com/DEFRA/rod-licensing/pull/1804) Apply correct html lang to static pages also ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.10 (2023-10-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1806](https://github.com/DEFRA/rod-licensing/pull/1806) Remove erroneous fieldset and fix aria description ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.9 (2023-10-05)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1808](https://github.com/DEFRA/rod-licensing/pull/1808) Fix markup on pricing summary box ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.8 (2023-10-05)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1807](https://github.com/DEFRA/rod-licensing/pull/1807) Remove unnecessary fieldset ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.7 (2023-10-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1805](https://github.com/DEFRA/rod-licensing/pull/1805) Add custom matcher for paths with possible empty fragment ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.6 (2023-09-29)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1795](https://github.com/DEFRA/rod-licensing/pull/1795) Refactor findPermit function ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.36.0-rc.5 (2023-09-28)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1799](https://github.com/DEFRA/rod-licensing/pull/1799) Stop redirect from always preserving skip link fragment ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.4 (2023-09-28)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1802](https://github.com/DEFRA/rod-licensing/pull/1802) skip link back button ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.36.0-rc.3 (2023-09-25)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1798](https://github.com/DEFRA/rod-licensing/pull/1798) Specify language in HTML tags ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.2 (2023-09-19)

#### :rocket: Enhancement
* [#1800](https://github.com/DEFRA/rod-licensing/pull/1800) Fix Docker for Node v18.17 ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.1 (2023-09-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1794](https://github.com/DEFRA/rod-licensing/pull/1794) Accessibility - back link ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.36.0-rc.0 (2023-09-15)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#1782](https://github.com/DEFRA/rod-licensing/pull/1782) Upgrade to v 18 of node ([@ScottDormand96](https://github.com/ScottDormand96))
* `gafl-webapp-service`
  * [#1788](https://github.com/DEFRA/rod-licensing/pull/1788) Accessibility - back link ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 2
- Phil Benson ([@jaucourt](https://github.com/jaucourt))
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.35.0-rc.17 (2023-09-05)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1789](https://github.com/DEFRA/rod-licensing/pull/1789) Stop Sales API requiring concession proof for PO entries ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.16 (2023-09-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1783](https://github.com/DEFRA/rod-licensing/pull/1783) Accessibility link ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.15 (2023-09-04)

#### :bug: Bug Fix
* `pocl-job`
  * [#1784](https://github.com/DEFRA/rod-licensing/pull/1784) Fix issues with processing postal order records ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.14 (2023-08-21)

#### :rocket: Enhancement
* `dynamics-lib`, `pocl-job`, `sales-api-service`
  * [#1740](https://github.com/DEFRA/rod-licensing/pull/1740) Update POCL job to accept new postal order fields ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.13 (2023-08-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1765](https://github.com/DEFRA/rod-licensing/pull/1765) Licence details print screen content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.12 (2023-08-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1766](https://github.com/DEFRA/rod-licensing/pull/1766) Stop easy renewals from copying shortTermPreferredMethodOfConfirmation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.9 (2023-07-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1755](https://github.com/DEFRA/rod-licensing/pull/1755) Update over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.7 (2023-07-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1752](https://github.com/DEFRA/rod-licensing/pull/1752) Update English language version of accessibility statement ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.6 (2023-07-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1741](https://github.com/DEFRA/rod-licensing/pull/1741) Over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.3 (2023-06-29)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1738](https://github.com/DEFRA/rod-licensing/pull/1738) Fix double count of page views from analytics banner ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.35.0-rc.1 (2023-06-08)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#1713](https://github.com/DEFRA/rod-licensing/pull/1713) Update dynamics-lib to handle postal order ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.35.0-rc.0 (2023-06-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1725](https://github.com/DEFRA/rod-licensing/pull/1725) Remove inset text about concession age ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
Must provide GITHUB_AUTH

## v1.35.0-rc.17 (2023-09-05)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1789](https://github.com/DEFRA/rod-licensing/pull/1789) Stop Sales API requiring concession proof for PO entries ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.16 (2023-09-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1783](https://github.com/DEFRA/rod-licensing/pull/1783) Accessibility link ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.15 (2023-09-04)

#### :bug: Bug Fix
* `pocl-job`
  * [#1784](https://github.com/DEFRA/rod-licensing/pull/1784) Fix issues with processing postal order records ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.14 (2023-08-21)

#### :rocket: Enhancement
* `dynamics-lib`, `pocl-job`, `sales-api-service`
  * [#1740](https://github.com/DEFRA/rod-licensing/pull/1740) Update POCL job to accept new postal order fields ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.13 (2023-08-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1765](https://github.com/DEFRA/rod-licensing/pull/1765) Licence details print screen content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.12 (2023-08-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1766](https://github.com/DEFRA/rod-licensing/pull/1766) Stop easy renewals from copying shortTermPreferredMethodOfConfirmation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.9 (2023-07-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1755](https://github.com/DEFRA/rod-licensing/pull/1755) Update over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.7 (2023-07-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1752](https://github.com/DEFRA/rod-licensing/pull/1752) Update English language version of accessibility statement ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.35.0-rc.6 (2023-07-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1741](https://github.com/DEFRA/rod-licensing/pull/1741) Over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.3 (2023-06-29)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1738](https://github.com/DEFRA/rod-licensing/pull/1738) Fix double count of page views from analytics banner ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.35.0-rc.1 (2023-06-08)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#1713](https://github.com/DEFRA/rod-licensing/pull/1713) Update dynamics-lib to handle postal order ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.35.0-rc.0 (2023-06-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1725](https://github.com/DEFRA/rod-licensing/pull/1725) Remove inset text about concession age ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))
Must provide GITHUB_AUTH

## v1.35.0-rc.17 (2023-09-05)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1789](https://github.com/DEFRA/rod-licensing/pull/1789) Stop Sales API requiring concession proof for PO entries ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.35.0-rc.16 (2023-09-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1783](https://github.com/DEFRA/rod-licensing/pull/1783) Accessibility link ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.35.0-rc.15 (2023-09-04)

#### :bug: Bug Fix
* `pocl-job`
  * [#1784](https://github.com/DEFRA/rod-licensing/pull/1784) Fix issues with processing postal order records ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.35.0-rc.14 (2023-08-21)

#### :rocket: Enhancement
* `dynamics-lib`, `pocl-job`, `sales-api-service`
  * [#1740](https://github.com/DEFRA/rod-licensing/pull/1740) Update POCL job to accept new postal order fields ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.35.0-rc.13 (2023-08-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1765](https://github.com/DEFRA/rod-licensing/pull/1765) Licence details print screen content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.35.0-rc.12 (2023-08-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1766](https://github.com/DEFRA/rod-licensing/pull/1766) Stop easy renewals from copying shortTermPreferredMethodOfConfirmation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.35.0-rc.9 (2023-07-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1755](https://github.com/DEFRA/rod-licensing/pull/1755) Update over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.35.0-rc.7 (2023-07-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1752](https://github.com/DEFRA/rod-licensing/pull/1752) Update English language version of accessibility statement ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.35.0-rc.6 (2023-07-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1741](https://github.com/DEFRA/rod-licensing/pull/1741) Over 66 content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.35.0-rc.3 (2023-06-29)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1738](https://github.com/DEFRA/rod-licensing/pull/1738) Fix double count of page views from analytics banner ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.35.0-rc.1 (2023-06-08)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#1713](https://github.com/DEFRA/rod-licensing/pull/1713) Update dynamics-lib to handle postal order ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.35.0-rc.0 (2023-06-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1725](https://github.com/DEFRA/rod-licensing/pull/1725) Remove inset text about concession age ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))





## v1.33.0-rc.21 (2023-05-17)

#### :rocket: Enhancement
* `sales-api-service`
  * [#1708](https://github.com/DEFRA/rod-licensing/pull/1708) Short term licence confirmation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.33.0-rc.20 (2023-05-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1714](https://github.com/DEFRA/rod-licensing/pull/1714) Remove hyperlink gov pay fail ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.33.0-rc.19 (2023-05-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1700](https://github.com/DEFRA/rod-licensing/pull/1700) Remove obsolete analytics attribution data ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.33.0-rc.18 (2023-05-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1707](https://github.com/DEFRA/rod-licensing/pull/1707) Licence details byelaws content ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1702](https://github.com/DEFRA/rod-licensing/pull/1702) Remove post office reference error page add button ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.33.0-rc.16 (2023-05-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1703](https://github.com/DEFRA/rod-licensing/pull/1703) Remove a from opens in a new tab ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.33.0-rc.15 (2023-04-24)

#### :rocket: Enhancement
* [#1699](https://github.com/DEFRA/rod-licensing/pull/1699) Update to envvar for analytics ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.33.0-rc.14 (2023-04-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1695](https://github.com/DEFRA/rod-licensing/pull/1695) Update GA secret property env var name ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))



## v1.33.0-rc.11 (2023-04-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1688](https://github.com/DEFRA/rod-licensing/pull/1688) Update Hapi-Gapi to v2 ([@MickStein](https://github.com/MickStein))
* `dynamics-lib`, `sales-api-service`
  * [#1652](https://github.com/DEFRA/rod-licensing/pull/1652) Add new field for short-term licence confirmation preferences ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.33.0-rc.10 (2023-04-11)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1686](https://github.com/DEFRA/rod-licensing/pull/1686) Fix typo in paperless message ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.33.0-rc.9 (2023-04-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1673](https://github.com/DEFRA/rod-licensing/pull/1673) Clarify content on licence fulfilment page ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.33.0-rc.7 (2023-03-31)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1672](https://github.com/DEFRA/rod-licensing/pull/1672) Remove redundant text from user journey ([@irisfaraway](https://github.com/irisfaraway))
  * [#1671](https://github.com/DEFRA/rod-licensing/pull/1671) Remove text from address lookup page ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.33.0-rc.6 (2023-03-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1669](https://github.com/DEFRA/rod-licensing/pull/1669) Welsh language refund policy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.33.0-rc.5 (2023-03-28)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1665](https://github.com/DEFRA/rod-licensing/pull/1665) Fishing byelaws link ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.33.0-rc.2 (2023-03-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1660](https://github.com/DEFRA/rod-licensing/pull/1660) Refund policy welsh ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1662](https://github.com/DEFRA/rod-licensing/pull/1662) Remove reference to post office on gov pay fail ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1661](https://github.com/DEFRA/rod-licensing/pull/1661) Error page persist welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.33.0-rc.1 (2023-03-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1657](https://github.com/DEFRA/rod-licensing/pull/1657) Refactor how we determine whether a licence can be posted ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.33.0-rc.0 (2023-03-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1622](https://github.com/DEFRA/rod-licensing/pull/1622) Refactor renewal start date validator ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.32.0-rc.0 (2023-03-07)

#### :bug: Bug Fix
* `pocl-job`
  * [#1655](https://github.com/DEFRA/rod-licensing/pull/1655) Stop checking SFTP ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.31.0-rc.15 (2023-02-23)

#### :bug: Bug Fix
* `business-rules-lib`, `sales-api-service`
  * [#1651](https://github.com/DEFRA/rod-licensing/pull/1651) Amend permission end date to use locale time ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.31.0-rc.14 (2023-02-23)

#### :rocket: Enhancement
* `gafl-webapp-service`, `pocl-job`
  * [#1629](https://github.com/DEFRA/rod-licensing/pull/1629) Improve test coverage ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.31.0-rc.13 (2023-02-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1646](https://github.com/DEFRA/rod-licensing/pull/1646) Welsh - date of birth page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.31.0-rc.11 (2023-02-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1647](https://github.com/DEFRA/rod-licensing/pull/1647) Add logic to display 'over 65' before 1/4 and 'over 66' on or after 1/4 ([@jaucourt](https://github.com/jaucourt))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1650](https://github.com/DEFRA/rod-licensing/pull/1650) Display price as free rather than £0 ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 2
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.31.0-rc.9 (2023-02-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1642](https://github.com/DEFRA/rod-licensing/pull/1642) Remove post office content from privacy page ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1643](https://github.com/DEFRA/rod-licensing/pull/1643) Refund policy remove post office and repetition ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.31.0-rc.8 (2023-02-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1641](https://github.com/DEFRA/rod-licensing/pull/1641) Date of birth message ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.31.0-rc.7 (2023-02-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1637](https://github.com/DEFRA/rod-licensing/pull/1637) Add "GOV.UK" suffix to new prices page title ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.31.0-rc.6 (2023-02-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1630](https://github.com/DEFRA/rod-licensing/pull/1630) Welsh - Price increase ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.31.0-rc.5 (2023-02-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1628](https://github.com/DEFRA/rod-licensing/pull/1628) Add Welsh translations for price change banner ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.31.0-rc.4 (2023-02-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1627](https://github.com/DEFRA/rod-licensing/pull/1627) Add price increase notification banner text ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))
Must provide GITHUB_AUTH

## v1.31.0-rc.2 (2023-02-07)

#### :rocket: Enhancement
* `sales-api-service`
  * [#1606](https://github.com/DEFRA/rod-licensing/pull/1606) Code coverage in authenticate.js ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.31.0-rc.1 (2023-02-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1625](https://github.com/DEFRA/rod-licensing/pull/1625) Fix completion message for junior licences ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.31.0-rc.0 (2023-02-02)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#1604](https://github.com/DEFRA/rod-licensing/pull/1604) Change in age of senior concession ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.30.0-rc.17 (2023-01-31)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1618](https://github.com/DEFRA/rod-licensing/pull/1618) Remove double pound sign on order complete page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.16 (2023-01-30)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1616](https://github.com/DEFRA/rod-licensing/pull/1616) Price incorrect on Licence Summary page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.30.0-rc.14 (2023-01-27)

#### :rocket: Enhancement
* `gafl-webapp-service`, `sales-api-service`
  * [#1613](https://github.com/DEFRA/rod-licensing/pull/1613) Update transaction journal to use new price ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.13 (2023-01-26)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1612](https://github.com/DEFRA/rod-licensing/pull/1612) Error after Ts&Cs page purchasing licence ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.12 (2023-01-25)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#1608](https://github.com/DEFRA/rod-licensing/pull/1608) Add getPrice to Permission ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.30.0-rc.10 (2023-01-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1602](https://github.com/DEFRA/rod-licensing/pull/1602) Fix translation and title errors on server error page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1603](https://github.com/DEFRA/rod-licensing/pull/1603) Stop language parameters from being duplicated in URLs ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.30.0-rc.9 (2023-01-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1598](https://github.com/DEFRA/rod-licensing/pull/1598) Use permission start date to calculate price ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.8 (2023-01-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1593](https://github.com/DEFRA/rod-licensing/pull/1593) Notification banner ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.30.0-rc.7 (2023-01-10)

#### :rocket: Enhancement
* `dynamics-lib`
  * [#1594](https://github.com/DEFRA/rod-licensing/pull/1594) Add new cost fields ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.6 (2023-01-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1600](https://github.com/DEFRA/rod-licensing/pull/1600) Fix typos in Welsh translation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.30.0-rc.5 (2023-01-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1580](https://github.com/DEFRA/rod-licensing/pull/1580) Refactor redirects to automatically use correct language ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.30.0-rc.4 (2023-01-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1590](https://github.com/DEFRA/rod-licensing/pull/1590) Add Welsh translations to server error messages ([@irisfaraway](https://github.com/irisfaraway))
  * [#1591](https://github.com/DEFRA/rod-licensing/pull/1591) Update Welsh translations for client errors ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.30.0-rc.3 (2022-12-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1585](https://github.com/DEFRA/rod-licensing/pull/1585) Remove 'order-complete' undefined logging ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.30.0-rc.2 (2022-12-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1579](https://github.com/DEFRA/rod-licensing/pull/1579) Trigger specific error response codes from route ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.30.0-rc.1 (2022-12-13)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1573](https://github.com/DEFRA/rod-licensing/pull/1573) Fix cache error ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.30.0-rc.0 (2022-12-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1570](https://github.com/DEFRA/rod-licensing/pull/1570) Back button during payment ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))




## v1.28.0-rc.8 (2022-12-05)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1562](https://github.com/DEFRA/rod-licensing/pull/1562) Phone number splitting over two lines ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.28.0-rc.7 (2022-12-05)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1526](https://github.com/DEFRA/rod-licensing/pull/1526) Contact Page shows incorrect information for license confirmation page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.28.0-rc.6 (2022-12-05)

#### :bug: Bug Fix
* [#1563](https://github.com/DEFRA/rod-licensing/pull/1563) Pin Docker to localstack v1.2.0 ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.28.0-rc.5 (2022-12-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1556](https://github.com/DEFRA/rod-licensing/pull/1556) Welsh - translations licence details ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.28.0-rc.4 (2022-11-28)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1555](https://github.com/DEFRA/rod-licensing/pull/1555) Welsh Translations - order complete licence details ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.28.0-rc.3 (2022-11-28)

#### :rocket: Enhancement
* [#1557](https://github.com/DEFRA/rod-licensing/pull/1557) Update dev env docker config ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.28.0-rc.2 (2022-11-25)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1554](https://github.com/DEFRA/rod-licensing/pull/1554) Persist language - order complete and licence details ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.28.0-rc.0 (2022-11-25)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1552](https://github.com/DEFRA/rod-licensing/pull/1552) Welsh translation - order complete page ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1553](https://github.com/DEFRA/rod-licensing/pull/1553) Welsh translation - licence details ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.27.0-rc.21 (2022-11-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1546](https://github.com/DEFRA/rod-licensing/pull/1546) Back button - licence type ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.20 (2022-11-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1535](https://github.com/DEFRA/rod-licensing/pull/1535) Refactor licence summary page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.27.0-rc.19 (2022-11-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1534](https://github.com/DEFRA/rod-licensing/pull/1534) Welsh - contact details ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.18 (2022-11-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1540](https://github.com/DEFRA/rod-licensing/pull/1540) Translation for you do not need a licence yet ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.27.0-rc.17 (2022-11-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1538](https://github.com/DEFRA/rod-licensing/pull/1538) Translation to how do they want their licence page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.27.0-rc.15 (2022-11-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1536](https://github.com/DEFRA/rod-licensing/pull/1536) Welsh translation for Do they want to go paperless? page ([@MickStein](https://github.com/MickStein))
  * [#1533](https://github.com/DEFRA/rod-licensing/pull/1533) Welsh - do you receive any of the following ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 2
- Michael Steinacher ([@MickStein](https://github.com/MickStein))
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.14 (2022-11-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1529](https://github.com/DEFRA/rod-licensing/pull/1529) Amend journey content for under 13 ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.13 (2022-11-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1503](https://github.com/DEFRA/rod-licensing/pull/1503) Welsh language - persist on error page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.27.0-rc.11 (2022-11-01)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1495](https://github.com/DEFRA/rod-licensing/pull/1495) Google search takes user incorrect page ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1518](https://github.com/DEFRA/rod-licensing/pull/1518) Analytics error when in welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))




## v1.27.0-rc.7 (2022-10-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1504](https://github.com/DEFRA/rod-licensing/pull/1504) Route to view server error page ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1501](https://github.com/DEFRA/rod-licensing/pull/1501) Welsh translation - error page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.6 (2022-10-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1290](https://github.com/DEFRA/rod-licensing/pull/1290) Welsh lang  update check contact details page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.27.0-rc.5 (2022-10-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1393](https://github.com/DEFRA/rod-licensing/pull/1393) Persist language misc route handler ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.27.0-rc.4 (2022-10-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1437](https://github.com/DEFRA/rod-licensing/pull/1437) Add route to view error page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))



## v1.27.0-rc.1 (2022-09-27)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1485](https://github.com/DEFRA/rod-licensing/pull/1485) Use chosen language when moving from renewals to new licence journey ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 2
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.27.0-rc.0 (2022-09-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1376](https://github.com/DEFRA/rod-licensing/pull/1376) Feature/iwtf 2934 welsh month and days ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.26.0-rc.54 (2022-09-20)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1483](https://github.com/DEFRA/rod-licensing/pull/1483) Hide analytics banner on licence details page ([@jaucourt](https://github.com/jaucourt))
  * [#1481](https://github.com/DEFRA/rod-licensing/pull/1481) Actioning analytics banner throws an error ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.26.0-rc.53 (2022-09-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1478](https://github.com/DEFRA/rod-licensing/pull/1478) Hide analytics banner ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.26.0-rc.52 (2022-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1476](https://github.com/DEFRA/rod-licensing/pull/1476) Cannot accept/reject analytics on renewal ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.26.0-rc.51 (2022-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1477](https://github.com/DEFRA/rod-licensing/pull/1477) analytics banner only /buy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.26.0-rc.50 (2022-09-15)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1472](https://github.com/DEFRA/rod-licensing/pull/1472) Feature/iwtf 2961 analytics track ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.26.0-rc.49 (2022-09-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1424](https://github.com/DEFRA/rod-licensing/pull/1424) Update welsh language of months on licence summary page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.26.0-rc.47 (2022-09-08)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1464](https://github.com/DEFRA/rod-licensing/pull/1464) Accessibility - phone number on contact ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1463](https://github.com/DEFRA/rod-licensing/pull/1463) Bugfix for welsh lang not persisting on cookies banner ([@MickStein](https://github.com/MickStein))

#### Committers: 2
- Michael Steinacher ([@MickStein](https://github.com/MickStein))
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.26.0-rc.45 (2022-09-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1462](https://github.com/DEFRA/rod-licensing/pull/1462) Amend Welsh translation for disability concession text ([@irisfaraway](https://github.com/irisfaraway))
  * [#1460](https://github.com/DEFRA/rod-licensing/pull/1460) Fix Welsh heading for licence type page ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.44 (2022-09-02)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1451](https://github.com/DEFRA/rod-licensing/pull/1451) Keep selected language when clicking manual address link ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.43 (2022-09-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1456](https://github.com/DEFRA/rod-licensing/pull/1456) Welsh translation for cookies banner ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.42 (2022-09-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1448](https://github.com/DEFRA/rod-licensing/pull/1448) Add Welsh translations to contact method page ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.26.0-rc.40 (2022-08-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1450](https://github.com/DEFRA/rod-licensing/pull/1450) Log tracking analytics ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.26.0-rc.38 (2022-08-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1441](https://github.com/DEFRA/rod-licensing/pull/1441) Welsh - BOBO - 'Which type of licence do they want?' ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.26.0-rc.37 (2022-08-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1444](https://github.com/DEFRA/rod-licensing/pull/1444) Amend Welsh translation on licence type page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1447](https://github.com/DEFRA/rod-licensing/pull/1447) Amend Welsh translation for manual address link in BOBO journey ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.26.0-rc.35 (2022-08-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1446](https://github.com/DEFRA/rod-licensing/pull/1446) Amend Welsh translation on licence start page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1445](https://github.com/DEFRA/rod-licensing/pull/1445) Update Welsh translation on disability concession page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1443](https://github.com/DEFRA/rod-licensing/pull/1443) Amend Welsh translation on address lookup page ([@irisfaraway](https://github.com/irisfaraway))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1442](https://github.com/DEFRA/rod-licensing/pull/1442) Fix typo in Welsh translation ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.34 (2022-08-30)

#### :rocket: Enhancement
* `gafl-webapp-service`, `sales-api-service`
  * [#1436](https://github.com/DEFRA/rod-licensing/pull/1436) Feature/iwtf 2961 analytics permission banner ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.26.0-rc.33 (2022-08-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1434](https://github.com/DEFRA/rod-licensing/pull/1434) Welsh transaltion update for cancelled payment page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.32 (2022-08-18)

#### :rocket: Enhancement
* `sales-api-service`
  * [#1431](https://github.com/DEFRA/rod-licensing/pull/1431) Include BST when calculating year-long licence end times ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.31 (2022-08-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1413](https://github.com/DEFRA/rod-licensing/pull/1413) Welsh not persisting when unauthenticated error ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.30 (2022-08-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1425](https://github.com/DEFRA/rod-licensing/pull/1425) Language doesn't persist on Renewals licence start ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.26.0-rc.28 (2022-08-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1423](https://github.com/DEFRA/rod-licensing/pull/1423) Welsh translation update to licence type page title ([@MickStein](https://github.com/MickStein))
  * [#1422](https://github.com/DEFRA/rod-licensing/pull/1422) Update welsh translation for 'mobile phone' ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.26.0-rc.26 (2022-08-09)

#### :rocket: Enhancement
* `sales-api-service`
  * [#1411](https://github.com/DEFRA/rod-licensing/pull/1411) Update end date and time rules for 12-month licences ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.26.0-rc.23 (2022-08-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1419](https://github.com/DEFRA/rod-licensing/pull/1419) feature/iwtf update privacy policy wording ([@MickStein](https://github.com/MickStein))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1420](https://github.com/DEFRA/rod-licensing/pull/1420) bugfix/iwtf 3006 remove persisting validation messages ([@MickStein](https://github.com/MickStein))
  * [#1418](https://github.com/DEFRA/rod-licensing/pull/1418) bugfix/iwtf 3011 renewal page dob fields require char limit ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.22 (2022-08-05)

#### :bug: Bug Fix
* [#1409](https://github.com/DEFRA/rod-licensing/pull/1409) bugfix/iwtf 2967 validation error for max char missing on find your a… ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))



## v1.26.0-rc.19 (2022-08-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1415](https://github.com/DEFRA/rod-licensing/pull/1415) feature/iwtf 3017 add full stop to licence for welsh lang ([@MickStein](https://github.com/MickStein))

#### :bug: Bug Fix
* `business-rules-lib`
  * [#1414](https://github.com/DEFRA/rod-licensing/pull/1414) bugfix/iwtf 2967 find your addess max char error not showing ([@MickStein](https://github.com/MickStein))
* `gafl-webapp-service`
  * [#1412](https://github.com/DEFRA/rod-licensing/pull/1412) bugfix/iwtf 2995 incorrect error showing in welsh renewal identify page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.18 (2022-08-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1410](https://github.com/DEFRA/rod-licensing/pull/1410) Pass current language to GOV.UK Pay API ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.17 (2022-08-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1403](https://github.com/DEFRA/rod-licensing/pull/1403) feature/iwtf 2995 Easy renewal, renewal start date welsh translation ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.16 (2022-07-29)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1387](https://github.com/DEFRA/rod-licensing/pull/1387) Include user's chosen language in GovPay return URL ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.26.0-rc.15 (2022-07-29)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1407](https://github.com/DEFRA/rod-licensing/pull/1407) bugfix/iwtf 2992 update example text and welsh dob error incorrect ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.26.0-rc.13 (2022-07-26)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1402](https://github.com/DEFRA/rod-licensing/pull/1402) Feature/iwtf 2992 welsh renew rod licence ([@MickStein](https://github.com/MickStein))
  * [#1404](https://github.com/DEFRA/rod-licensing/pull/1404) feature/iwtf 2993 Easy renewals check licence details welsh translation ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.26.0-rc.12 (2022-07-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1399](https://github.com/DEFRA/rod-licensing/pull/1399) Easy renewals wording change renew rod licence? page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.26.0-rc.10 (2022-07-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1391](https://github.com/DEFRA/rod-licensing/pull/1391) Modify Welsh text on concessions page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1390](https://github.com/DEFRA/rod-licensing/pull/1390) Update messages about postcode ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.26.0-rc.7 (2022-07-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1392](https://github.com/DEFRA/rod-licensing/pull/1392) Welsh - Enter address manual title ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1388](https://github.com/DEFRA/rod-licensing/pull/1388) Privacy policy - add missing welsh translations ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1389](https://github.com/DEFRA/rod-licensing/pull/1389) Accessibility - Phone error message ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))






## v1.26.0-rc.1 (2022-07-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1370](https://github.com/DEFRA/rod-licensing/pull/1370) Welsh - enter address manually ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1369](https://github.com/DEFRA/rod-licensing/pull/1369) Welsh - find their address heading ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1368](https://github.com/DEFRA/rod-licensing/pull/1368) Welsh translation - error messages find address ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1362](https://github.com/DEFRA/rod-licensing/pull/1362) Feature/iwtf 2916 change language persists ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1359](https://github.com/DEFRA/rod-licensing/pull/1359) Persist language in misc route ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1315](https://github.com/DEFRA/rod-licensing/pull/1315) Error when navigating to licence for from find your address ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))






## v1.25.0-rc.11 (2022-06-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1305](https://github.com/DEFRA/rod-licensing/pull/1305) Welsh - Privacy policy ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1357](https://github.com/DEFRA/rod-licensing/pull/1357) Welsh - licence confirmation BOBO ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1360](https://github.com/DEFRA/rod-licensing/pull/1360) Cookies page welsh translations ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.25.0-rc.10 (2022-06-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1342](https://github.com/DEFRA/rod-licensing/pull/1342) Open footer link to OS terms in same window ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))

## v1.25.0-rc.9 (2022-06-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1348](https://github.com/DEFRA/rod-licensing/pull/1348) Welsh translation for cookies ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.25.0-rc.8 (2022-06-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1343](https://github.com/DEFRA/rod-licensing/pull/1343) Bug fix for Translation - Check the licence details missing translations ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.25.0-rc.7 (2022-06-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1313](https://github.com/DEFRA/rod-licensing/pull/1313) Welsh - bobo fishing licence confirmation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.25.0-rc.6 (2022-06-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1303](https://github.com/DEFRA/rod-licensing/pull/1303) Welsh - Cookies policy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.25.0-rc.5 (2022-06-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1314](https://github.com/DEFRA/rod-licensing/pull/1314) Welsh - NRW comments on who licence for ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.25.0-rc.3 (2022-06-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1338](https://github.com/DEFRA/rod-licensing/pull/1338) Add Welsh translation for accessibility statement title ([@irisfaraway](https://github.com/irisfaraway))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1329](https://github.com/DEFRA/rod-licensing/pull/1329) Open OS terms footer link in a new tab ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))



## v1.25.0-rc.0 (2022-06-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1330](https://github.com/DEFRA/rod-licensing/pull/1330) Update Welsh text when selecting licence start date ([@irisfaraway](https://github.com/irisfaraway))
  * [#1331](https://github.com/DEFRA/rod-licensing/pull/1331) Update button text for licence terms page ([@irisfaraway](https://github.com/irisfaraway))
  * [#1332](https://github.com/DEFRA/rod-licensing/pull/1332) Update Welsh language title attribute for refund policy ([@irisfaraway](https://github.com/irisfaraway))

#### Committers: 1
- Iris Faraway ([@irisfaraway](https://github.com/irisfaraway))


## v1.24.0-rc.13 (2022-06-08)

#### :rocket: Enhancement
* `business-rules-lib`, `dynamics-lib`, `gafl-webapp-service`, `payment-mop-up-job`, `sales-api-service`
  * [#1317](https://github.com/DEFRA/rod-licensing/pull/1317) Feature/easy renewals enhancements ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.24.0-rc.12 (2022-06-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1300](https://github.com/DEFRA/rod-licensing/pull/1300) Update welsh lang on licence summary page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.24.0-rc.11 (2022-05-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1306](https://github.com/DEFRA/rod-licensing/pull/1306) Amend error page after going back during payment ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.24.0-rc.10 (2022-05-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1312](https://github.com/DEFRA/rod-licensing/pull/1312) Welsh - Accessibility Statement ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.9 (2022-05-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1311](https://github.com/DEFRA/rod-licensing/pull/1311) Welsh - how contact with reminders ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.8 (2022-05-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1307](https://github.com/DEFRA/rod-licensing/pull/1307) Welsh - refund policy ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.7 (2022-05-20)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1304](https://github.com/DEFRA/rod-licensing/pull/1304) Fix failing test on short licence error page update  ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.24.0-rc.6 (2022-05-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1296](https://github.com/DEFRA/rod-licensing/pull/1296) Short licence error page update - easy renewals ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.24.0-rc.5 (2022-05-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1299](https://github.com/DEFRA/rod-licensing/pull/1299) Welsh lang BOBO update where to send licence page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.24.0-rc.4 (2022-05-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1298](https://github.com/DEFRA/rod-licensing/pull/1298) Welsh - where send licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.3 (2022-05-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1297](https://github.com/DEFRA/rod-licensing/pull/1297) Welsh - how do you want fishing licence confirmation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.2 (2022-05-19)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1301](https://github.com/DEFRA/rod-licensing/pull/1301) Welsh - BOBO how long do they want licence for ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.1 (2022-05-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1274](https://github.com/DEFRA/rod-licensing/pull/1274) Refactor licence type summary macro ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.24.0-rc.0 (2022-05-18)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1295](https://github.com/DEFRA/rod-licensing/pull/1295) Contact confirmation doesn't persist language ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))



## v1.23.0-rc.69 (2022-05-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1289](https://github.com/DEFRA/rod-licensing/pull/1289) Update OS Crown and Copyright ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.23.0-rc.66 (2022-05-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1285](https://github.com/DEFRA/rod-licensing/pull/1285) Welsh - Where send your fishing licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.65 (2022-05-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1286](https://github.com/DEFRA/rod-licensing/pull/1286) Find your address - missing welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.64 (2022-05-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1280](https://github.com/DEFRA/rod-licensing/pull/1280) Is the phone number correct - welsh translation ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.63 (2022-05-11)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1266](https://github.com/DEFRA/rod-licensing/pull/1266) Feature/iwtf 2838 renew international licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.23.0-rc.60 (2022-05-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1277](https://github.com/DEFRA/rod-licensing/pull/1277) Update welsh lang for BOBO go paperless page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.59 (2022-05-10)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1226](https://github.com/DEFRA/rod-licensing/pull/1226) Lang=cy is not persisting across pages ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.58 (2022-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1276](https://github.com/DEFRA/rod-licensing/pull/1276) Welsh lang update BOBO how should we contact them page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.57 (2022-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1275](https://github.com/DEFRA/rod-licensing/pull/1275) Welsh lang update for BOBO man address entry page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.56 (2022-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1270](https://github.com/DEFRA/rod-licensing/pull/1270) Is your email address correct - welsh translation ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.55 (2022-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1213](https://github.com/DEFRA/rod-licensing/pull/1213) Welsh Translation - How long want licence for ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.54 (2022-05-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1260](https://github.com/DEFRA/rod-licensing/pull/1260) Welsh translation - contact reminders ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.53 (2022-05-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1265](https://github.com/DEFRA/rod-licensing/pull/1265) Do you want to go paperless? - welsh translation ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)



## v1.23.0-rc.50 (2022-05-04)

#### :bug: Bug Fix
* `business-rules-lib`, `gafl-webapp-service`
  * [#1255](https://github.com/DEFRA/rod-licensing/pull/1255) International postcodes not accepted ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.23.0-rc.48 (2022-05-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1259](https://github.com/DEFRA/rod-licensing/pull/1259) Amend placement of warning on Licence conditions page ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.47 (2022-04-28)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1254](https://github.com/DEFRA/rod-licensing/pull/1254) Update address hints to lower case ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.46 (2022-04-28)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1253](https://github.com/DEFRA/rod-licensing/pull/1253) Result function not called for licence for page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.45 (2022-04-28)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1256](https://github.com/DEFRA/rod-licensing/pull/1256) Fix for missing translation on BOBO date of birth page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.44 (2022-04-27)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1249](https://github.com/DEFRA/rod-licensing/pull/1249) Bug fix for BOBO date of birth page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.42 (2022-04-26)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1246](https://github.com/DEFRA/rod-licensing/pull/1246) Welsh lang BOBO update date of birth page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))



## v1.23.0-rc.39 (2022-04-21)

#### :bug: Bug Fix
* `pocl-job`
  * [#1240](https://github.com/DEFRA/rod-licensing/pull/1240) DD Import start date & time ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.38 (2022-04-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1223](https://github.com/DEFRA/rod-licensing/pull/1223) Welsh - Choose your address ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.37 (2022-04-19)

#### :bug: Bug Fix
* `sales-api-service`
  * [#1220](https://github.com/DEFRA/rod-licensing/pull/1220) Validation errors not handled for DD File ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.36 (2022-04-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1224](https://github.com/DEFRA/rod-licensing/pull/1224) Welsh lang translation licence-for page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.35 (2022-04-14)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1227](https://github.com/DEFRA/rod-licensing/pull/1227) Welsh lang DOB page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.33 (2022-04-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1222](https://github.com/DEFRA/rod-licensing/pull/1222) Welsh lang for BOBO find address page ([@MickStein](https://github.com/MickStein))
  * [#1217](https://github.com/DEFRA/rod-licensing/pull/1217) Update welsh lang bobo licence type ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.32 (2022-04-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1221](https://github.com/DEFRA/rod-licensing/pull/1221) Welsh translation on find address page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.31 (2022-04-12)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1212](https://github.com/DEFRA/rod-licensing/pull/1212) Welsh Translate - BOBO - receive any of following ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.30 (2022-04-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1211](https://github.com/DEFRA/rod-licensing/pull/1211) Welsh translate - Do you receive any of the following? ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.29 (2022-04-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1218](https://github.com/DEFRA/rod-licensing/pull/1218) Bug fix for cookies page backlink ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.27 (2022-04-11)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1216](https://github.com/DEFRA/rod-licensing/pull/1216) Bug fix for missing translations on for you licence-start page ([@MickStein](https://github.com/MickStein))
  * [#1215](https://github.com/DEFRA/rod-licensing/pull/1215) Bug fix for start-page welsh translations ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.25 (2022-04-11)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1199](https://github.com/DEFRA/rod-licensing/pull/1199) Add Welsh translation on licence-type page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.23 (2022-04-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1195](https://github.com/DEFRA/rod-licensing/pull/1195) Welsh Translation - receive any of following ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.22 (2022-04-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1197](https://github.com/DEFRA/rod-licensing/pull/1197) Minor updates to the 'When would you like your licence to start? ' ([@MickStein](https://github.com/MickStein))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1198](https://github.com/DEFRA/rod-licensing/pull/1198) Bug fix for licence start page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.21 (2022-04-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1196](https://github.com/DEFRA/rod-licensing/pull/1196) Easy Renewals Vanity URL ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.20 (2022-04-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1190](https://github.com/DEFRA/rod-licensing/pull/1190) Bobo - where send licence ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.19 (2022-04-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1185](https://github.com/DEFRA/rod-licensing/pull/1185) Add welsh translation for start-time page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.18 (2022-04-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1186](https://github.com/DEFRA/rod-licensing/pull/1186) Add start licence start page welsh translation ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.17 (2022-04-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1189](https://github.com/DEFRA/rod-licensing/pull/1189) Update cy locales file to english translations ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.16 (2022-04-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1175](https://github.com/DEFRA/rod-licensing/pull/1175) Update url for renewals ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.15 (2022-04-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1188](https://github.com/DEFRA/rod-licensing/pull/1188) BOBO - wording how contact ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.23.0-rc.14 (2022-04-05)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1191](https://github.com/DEFRA/rod-licensing/pull/1191) Fix for welsh translation on bobo name page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.13 (2022-04-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1180](https://github.com/DEFRA/rod-licensing/pull/1180) Add welsh lang translation to name page for someone else ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.12 (2022-04-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1182](https://github.com/DEFRA/rod-licensing/pull/1182) Welsh Language toggle  ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.11 (2022-04-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1179](https://github.com/DEFRA/rod-licensing/pull/1179) Iwtf 2709 welsh lang name page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.23.0-rc.10 (2022-03-31)

#### :rocket: Enhancement
* [#1176](https://github.com/DEFRA/rod-licensing/pull/1176) Change husky to run the full test suite ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.23.0-rc.9 (2022-03-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1133](https://github.com/DEFRA/rod-licensing/pull/1133) Update address lookup capital formatting ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.23.0-rc.7 (2022-03-29)

#### :memo: Documentation
* [#1168](https://github.com/DEFRA/rod-licensing/pull/1168) Update documentation on volumes ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)






## v1.23.0-rc.1 (2022-03-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1124](https://github.com/DEFRA/rod-licensing/pull/1124) Feature/iwtf 2369 console error ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.40 (2022-03-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1128](https://github.com/DEFRA/rod-licensing/pull/1128) Update find address hint text to be consistent ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.39 (2022-03-03)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1126](https://github.com/DEFRA/rod-licensing/pull/1126) Fix for incorrect title on confirmation method page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.38 (2022-03-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1123](https://github.com/DEFRA/rod-licensing/pull/1123) Replace footmarks with apostrophes ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.36 (2022-03-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1122](https://github.com/DEFRA/rod-licensing/pull/1122) Update to licence details link to be more generic ([@MickStein](https://github.com/MickStein))
  * [#1119](https://github.com/DEFRA/rod-licensing/pull/1119) Update how should we contact person page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.35 (2022-03-02)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1120](https://github.com/DEFRA/rod-licensing/pull/1120) Follow-up update to licence conditions text ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.31 (2022-02-25)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1111](https://github.com/DEFRA/rod-licensing/pull/1111) Update order complete page ([@jaucourt](https://github.com/jaucourt))
  * [#1110](https://github.com/DEFRA/rod-licensing/pull/1110) Update licence details page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.22.0-rc.28 (2022-02-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1104](https://github.com/DEFRA/rod-licensing/pull/1104) Update text on licence complete confirmation page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.26 (2022-02-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1093](https://github.com/DEFRA/rod-licensing/pull/1093) Remove additional logging ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1094](https://github.com/DEFRA/rod-licensing/pull/1094) Alternate image text for calendar ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.23 (2022-02-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1074](https://github.com/DEFRA/rod-licensing/pull/1074) Easy renewals vanity URL ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1092](https://github.com/DEFRA/rod-licensing/pull/1092) Feature/iwtf 2744 content issue ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.21 (2022-02-17)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#1087](https://github.com/DEFRA/rod-licensing/pull/1087) Upgrade OpenPGP Library ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.22.0-rc.20 (2022-02-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1088](https://github.com/DEFRA/rod-licensing/pull/1088) Update privacy policy ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.19 (2022-02-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1084](https://github.com/DEFRA/rod-licensing/pull/1084) Missing content on page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.18 (2022-02-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1086](https://github.com/DEFRA/rod-licensing/pull/1086) Update link to annual fishery report ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.16 (2022-02-15)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1085](https://github.com/DEFRA/rod-licensing/pull/1085) Fix for back button from address lookup page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.15 (2022-02-14)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1075](https://github.com/DEFRA/rod-licensing/pull/1075) Fix attribution redirect for renewals ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.22.0-rc.11 (2022-02-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1070](https://github.com/DEFRA/rod-licensing/pull/1070) Welsh translation - eligible ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1068](https://github.com/DEFRA/rod-licensing/pull/1068) Feature/iwtf 2671 licence start welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.10 (2022-02-08)

#### :rocket: Enhancement
* [#1069](https://github.com/DEFRA/rod-licensing/pull/1069) Update readme for env var structure ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.9 (2022-02-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1057](https://github.com/DEFRA/rod-licensing/pull/1057) Welsh translation for date of birth ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.8 (2022-02-04)

#### :rocket: Enhancement
* [#1045](https://github.com/DEFRA/rod-licensing/pull/1045) Alter env var structure ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.7 (2022-02-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1056](https://github.com/DEFRA/rod-licensing/pull/1056) Feature/iwtf 2647 easy renewal content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.6 (2022-02-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1031](https://github.com/DEFRA/rod-licensing/pull/1031) Feature/iwtf 2590 attribution redirect ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.5 (2022-02-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1053](https://github.com/DEFRA/rod-licensing/pull/1053) Reword fishing licence confirmation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.0 (2021-11-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#973](https://github.com/DEFRA/rod-licensing/pull/973) Generic Notice of Service Error ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.22.0-rc.40 (2022-03-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1128](https://github.com/DEFRA/rod-licensing/pull/1128) Update find address hint text to be consistent ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.39 (2022-03-03)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1126](https://github.com/DEFRA/rod-licensing/pull/1126) Fix for incorrect title on confirmation method page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.38 (2022-03-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1123](https://github.com/DEFRA/rod-licensing/pull/1123) Replace footmarks with apostrophes ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.36 (2022-03-02)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1122](https://github.com/DEFRA/rod-licensing/pull/1122) Update to licence details link to be more generic ([@MickStein](https://github.com/MickStein))
  * [#1119](https://github.com/DEFRA/rod-licensing/pull/1119) Update how should we contact person page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.35 (2022-03-02)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1120](https://github.com/DEFRA/rod-licensing/pull/1120) Follow-up update to licence conditions text ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))




## v1.22.0-rc.31 (2022-02-25)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1111](https://github.com/DEFRA/rod-licensing/pull/1111) Update order complete page ([@jaucourt](https://github.com/jaucourt))
  * [#1110](https://github.com/DEFRA/rod-licensing/pull/1110) Update licence details page ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))



## v1.22.0-rc.28 (2022-02-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1104](https://github.com/DEFRA/rod-licensing/pull/1104) Update text on licence complete confirmation page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.26 (2022-02-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1093](https://github.com/DEFRA/rod-licensing/pull/1093) Remove additional logging ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1094](https://github.com/DEFRA/rod-licensing/pull/1094) Alternate image text for calendar ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))



## v1.22.0-rc.23 (2022-02-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1074](https://github.com/DEFRA/rod-licensing/pull/1074) Easy renewals vanity URL ([@ScottDormand96](https://github.com/ScottDormand96))

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1092](https://github.com/DEFRA/rod-licensing/pull/1092) Feature/iwtf 2744 content issue ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))


## v1.22.0-rc.21 (2022-02-17)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#1087](https://github.com/DEFRA/rod-licensing/pull/1087) Upgrade OpenPGP Library ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.22.0-rc.20 (2022-02-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1088](https://github.com/DEFRA/rod-licensing/pull/1088) Update privacy policy ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.19 (2022-02-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1084](https://github.com/DEFRA/rod-licensing/pull/1084) Missing content on page ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.18 (2022-02-16)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1086](https://github.com/DEFRA/rod-licensing/pull/1086) Update link to annual fishery report ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))


## v1.22.0-rc.16 (2022-02-15)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1085](https://github.com/DEFRA/rod-licensing/pull/1085) Fix for back button from address lookup page ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.15 (2022-02-14)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#1075](https://github.com/DEFRA/rod-licensing/pull/1075) Fix attribution redirect for renewals ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))




## v1.22.0-rc.11 (2022-02-09)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1070](https://github.com/DEFRA/rod-licensing/pull/1070) Welsh translation - eligible ([@ScottDormand96](https://github.com/ScottDormand96))
  * [#1068](https://github.com/DEFRA/rod-licensing/pull/1068) Feature/iwtf 2671 licence start welsh ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.10 (2022-02-08)

#### :rocket: Enhancement
* [#1069](https://github.com/DEFRA/rod-licensing/pull/1069) Update readme for env var structure ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.9 (2022-02-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1057](https://github.com/DEFRA/rod-licensing/pull/1057) Welsh translation for date of birth ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.8 (2022-02-04)

#### :rocket: Enhancement
* [#1045](https://github.com/DEFRA/rod-licensing/pull/1045) Alter env var structure ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.7 (2022-02-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1056](https://github.com/DEFRA/rod-licensing/pull/1056) Feature/iwtf 2647 easy renewal content ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))

## v1.22.0-rc.6 (2022-02-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1031](https://github.com/DEFRA/rod-licensing/pull/1031) Feature/iwtf 2590 attribution redirect ([@MickStein](https://github.com/MickStein))

#### Committers: 1
- Michael Steinacher ([@MickStein](https://github.com/MickStein))

## v1.22.0-rc.5 (2022-02-01)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#1053](https://github.com/DEFRA/rod-licensing/pull/1053) Reword fishing licence confirmation ([@ScottDormand96](https://github.com/ScottDormand96))

#### Committers: 1
- Scott Dormand ([@ScottDormand96](https://github.com/ScottDormand96))





## v1.22.0-rc.0 (2021-11-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#973](https://github.com/DEFRA/rod-licensing/pull/973) Generic Notice of Service Error ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))


## v1.21.0-rc.3 (2021-11-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#969](https://github.com/DEFRA/rod-licensing/pull/969) Validate licence start time ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.21.0-rc.2 (2021-11-09)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#949](https://github.com/DEFRA/rod-licensing/pull/949) Changing fulfilment after visiting contact summary gives invalid options ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.21.0-rc.1 (2021-11-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#964](https://github.com/DEFRA/rod-licensing/pull/964) Incorrect wording on the rod licence paperless web journey ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.21.0-rc.0 (2021-11-05)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#962](https://github.com/DEFRA/rod-licensing/pull/962) Annual accessibility statement review - Summer 2021 ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)



## v1.20.0-rc.21 (2021-10-27)

#### :bug: Bug Fix
* `sales-api-service`
  * [#952](https://github.com/DEFRA/rod-licensing/pull/952) 'Invalid date' in permission reference ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.20.0-rc.20 (2021-10-26)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#948](https://github.com/DEFRA/rod-licensing/pull/948) Fix start time layout ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.20.0-rc.19 (2021-10-26)

#### :rocket: Enhancement
* `connectors-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#904](https://github.com/DEFRA/rod-licensing/pull/904) Upgrade Jest to v27 ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.20.0-rc.18 (2021-10-22)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#943](https://github.com/DEFRA/rod-licensing/pull/943) Back button takes back to the Contact summary page instead of digital license pages ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.20.0-rc.16 (2021-10-21)

#### :bug: Bug Fix
* `sales-api-service`
  * [#933](https://github.com/DEFRA/rod-licensing/pull/933) Licence start time is not displayed after amendment ([@jaucourt](https://github.com/jaucourt))
* `gafl-webapp-service`
  * [#942](https://github.com/DEFRA/rod-licensing/pull/942) Purchasing a 1 or 8 day licence, then changing to a 12 month displays… ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 2
- Phil Benson ([@jaucourt](https://github.com/jaucourt))
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.20.0-rc.14 (2021-10-07)

#### :bug: Bug Fix
* `sales-api-service`
  * [#923](https://github.com/DEFRA/rod-licensing/pull/923) Only amend start time for web and telesales ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.20.0-rc.13 (2021-10-07)

#### :bug: Bug Fix
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#924](https://github.com/DEFRA/rod-licensing/pull/924) Unable to publish npm packages ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)
## v1.20.0-rc.10 (2021-10-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#921](https://github.com/DEFRA/rod-licensing/pull/921) Back button takes back to the Contact summary page instead of digital license pages ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.20.0-rc.8 (2021-09-30)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#915](https://github.com/DEFRA/rod-licensing/pull/915) Clicking on Licence change link on the Contact Summary page does not … ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.20.0-rc.7 (2021-09-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#914](https://github.com/DEFRA/rod-licensing/pull/914) Added missing class to link ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.20.0-rc.6 (2021-09-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#908](https://github.com/DEFRA/rod-licensing/pull/908) Link to redirect to buy on renewal page ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.20.0-rc.4 (2021-09-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#902](https://github.com/DEFRA/rod-licensing/pull/902) Adds email/text check page ([@DGajewska](https://github.com/DGajewska))

#### Committers: 1
- Dana Gajewska ([@DGajewska](https://github.com/DGajewska))

## v1.20.0-rc.3 (2021-09-20)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#903](https://github.com/DEFRA/rod-licensing/pull/903) Unexpected error is displayed when try to renew another license ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.20.0-rc.2 (2021-09-17)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#895](https://github.com/DEFRA/rod-licensing/pull/895) Easy Renewal-Clicking on back button and proceeding forward on summar… ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.20.0-rc.1 (2021-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#894](https://github.com/DEFRA/rod-licensing/pull/894) Find Address page does not hold previous values when accessing from t… ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)




## v1.19.0-rc.4 (2021-08-31)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#879](https://github.com/DEFRA/rod-licensing/pull/879) Additional logging for order-complete undefined ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)






## v1.18.0-rc.7 (2021-08-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#867](https://github.com/DEFRA/rod-licensing/pull/867) Fixed issue when the licence is make a note ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.18.0-rc.6 (2021-08-20)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#860](https://github.com/DEFRA/rod-licensing/pull/860) Content changes: display age concession ([@DGajewska](https://github.com/DGajewska))

#### Committers: 1
- Dana Gajewska ([@DGajewska](https://github.com/DGajewska))



## v1.18.0-rc.3 (2021-08-19)

#### :rocket: Enhancement
* `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `sales-api-service`
  * [#858](https://github.com/DEFRA/rod-licensing/pull/858) feature/obfuscated dob ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.18.0-rc.2 (2021-08-18)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#856](https://github.com/DEFRA/rod-licensing/pull/856) When logging in with one permission and going back and entering anoth… ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.18.0-rc.0 (2021-08-12)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`
  * [#854](https://github.com/DEFRA/rod-licensing/pull/854) Add more logging details to errbit ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)




## v1.17.0-rc.6 (2021-08-09)

#### :bug: Bug Fix
* `dynamics-lib`, `sales-api-service`
  * [#841](https://github.com/DEFRA/rod-licensing/pull/841) Easy renewals login not working ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.17.0-rc.4 (2021-08-09)

#### :rocket: Enhancement
* `dynamics-lib`, `pocl-job`, `sales-api-service`
  * [#840](https://github.com/DEFRA/rod-licensing/pull/840) Fix: Sonar cloud issues & test coverage ([@DGajewska](https://github.com/DGajewska))

#### Committers: 1
- Dana Gajewska ([@DGajewska](https://github.com/DGajewska))

## v1.17.0-rc.3 (2021-08-06)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#838](https://github.com/DEFRA/rod-licensing/pull/838) Content Changes: Removes references to PDF in accessibility statement ([@DGajewska](https://github.com/DGajewska))

#### Committers: 1
- Dana Gajewska ([@DGajewska](https://github.com/DGajewska))


## v1.17.0-rc.1 (2021-08-04)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#834](https://github.com/DEFRA/rod-licensing/pull/834) Removal of Beta badge on GAFL service ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)




## v1.16.0-rc.4 (2021-07-23)

#### :bug: Bug Fix
* `business-rules-lib`
  * [#818](https://github.com/DEFRA/rod-licensing/pull/818) Unexpected response from the Sales API - date before minimum allowed ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)

## v1.16.0-rc.3 (2021-07-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#816](https://github.com/DEFRA/rod-licensing/pull/816) Print Licence Confirmation ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)



## v1.16.0-rc.0 (2021-07-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#806](https://github.com/DEFRA/rod-licensing/pull/806) Links opening in new window without notifying the user ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.15.0-rc.0 (2021-07-13)

#### :rocket: Enhancement
* `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  * [#804](https://github.com/DEFRA/rod-licensing/pull/804) feature/digital licence ([@nabeelamir-defra](https://github.com/nabeelamir-defra))

#### Committers: 1
- [@nabeelamir-defra](https://github.com/nabeelamir-defra)


## v1.14.0-rc.5 (2021-06-29)

#### :bug: Bug Fix
* [#785](https://github.com/DEFRA/rod-licensing/pull/785) Fix changelog generation ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))
Must provide GITHUB_AUTH
Must provide GITHUB_AUTH

## v1.14.0-rc.2 (2021-06-28)

#### :rocket: Enhancement
* `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#787](https://github.com/DEFRA/rod-licensing/pull/787) Doing cool stuff ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v1.10.0
* Updates Accessibility Statement headings to use correct semantics
* Use serial number as Payment id for POCL transactions
* Text changes on licence type and name screen
* Change calendar icon to have better colour contrast
* Move continue button out of fieldset for forms
* Makes cost summary panel screen reader friendly
* Fix broken footer links
* Handle new and old GA client id formats


## v1.4.0-rc.1 (2020-10-29)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#458](https://github.com/DEFRA/rod-licensing/pull/458) Enable x-domain analytics tracking & persist attribution between sessions ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))



## v1.3.0-rc.5 (2020-10-27)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#454](https://github.com/DEFRA/rod-licensing/pull/454) Ensure cache manager calls disconnect on ioredis when terminating ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v1.3.0-rc.4 (2020-10-27)

#### :bug: Bug Fix
* `connectors-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#451](https://github.com/DEFRA/rod-licensing/pull/451) Fix ioredis preventing shutdown & use spec-compliant interrupt exit-code ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v1.3.0-rc.2 (2020-10-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#414](https://github.com/DEFRA/rod-licensing/pull/414) Add moto flag for telesales ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v1.3.0-rc.1 (2020-10-22)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#438](https://github.com/DEFRA/rod-licensing/pull/438) Added telesales new customer button (#438) ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v1.3.0-rc.0 (2020-10-22)

#### :rocket: Enhancement
* `connectors-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#439](https://github.com/DEFRA/rod-licensing/pull/439) Add airbrake support all services ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v1.2.0-rc.0 (2020-10-15)

#### :rocket: Enhancement
* `pocl-job`, `sales-api-service`
  * [#432](https://github.com/DEFRA/rod-licensing/pull/432) Relax address validation rules for P.O. and correct sales date ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v1.1.0-rc.0 (2020-10-14)

#### :rocket: Enhancement
* `sales-api-service`
  * [#430](https://github.com/DEFRA/rod-licensing/pull/430) Relax validation rules for Post Office sales ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.93 (2020-10-13)

#### :bug: Bug Fix
* [#428](https://github.com/DEFRA/rod-licensing/pull/428) Fix bug in travis deploy script ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.92 (2020-10-13)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#426](https://github.com/DEFRA/rod-licensing/pull/426) Changes to the accessibility statement ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.91 (2020-10-12)

#### :rocket: Enhancement
* [#425](https://github.com/DEFRA/rod-licensing/pull/425) Improve versioning control in travis deploy script when merging to master ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.89 (2020-10-12)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#423](https://github.com/DEFRA/rod-licensing/pull/423) Use dates in local time for licence start date calculation/validation in the frontend. ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.88 (2020-10-12)

#### :rocket: Enhancement
* `payment-mop-up-job`
  * [#422](https://github.com/DEFRA/rod-licensing/pull/422) Reduce default time for mop-up eligibility to 60 minutes ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.87 (2020-10-08)

#### :rocket: Enhancement
* `sales-api-service`
  * [#412](https://github.com/DEFRA/rod-licensing/pull/412) Update permission number generator to use a sequence and add a checksum ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.86 (2020-10-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#413](https://github.com/DEFRA/rod-licensing/pull/413) Add section to privacy policy regarding use of Google Analytics ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.84 (2020-10-07)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#409](https://github.com/DEFRA/rod-licensing/pull/409) Handle cases where no country available on contact record being fulfilled ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.83 (2020-10-07)

#### :rocket: Enhancement
* `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `payment-mop-up-job`, `pocl-job`
  * [#408](https://github.com/DEFRA/rod-licensing/pull/408) Updates and fixes to the ETL tasks ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.82 (2020-10-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#406](https://github.com/DEFRA/rod-licensing/pull/406) Change error messages on name page ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.81 (2020-10-06)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#404](https://github.com/DEFRA/rod-licensing/pull/404) Ensure date validator schemas are created at the time of use ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.80 (2020-10-05)

#### :rocket: Enhancement
* `fulfilment-job`
  * [#403](https://github.com/DEFRA/rod-licensing/pull/403) Tweak fulfilment to ensure duration/equipment compatible with old service ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.79 (2020-10-05)

#### :rocket: Enhancement
* `connectors-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sqs-receiver-service`
  * [#398](https://github.com/DEFRA/rod-licensing/pull/398) Implement distributed locks to prevent concurrent execution of ETL tasks ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.78 (2020-10-01)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#397](https://github.com/DEFRA/rod-licensing/pull/397) Amend accept cookies cookie name ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v0.3.0-rc.77 (2020-09-30)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#396](https://github.com/DEFRA/rod-licensing/pull/396) Fix content ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.76 (2020-09-29)

#### :rocket: Enhancement
* `business-rules-lib`
  * [#395](https://github.com/DEFRA/rod-licensing/pull/395) Adjust contact name validator to ensure 100% coverage  ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.75 (2020-09-29)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#383](https://github.com/DEFRA/rod-licensing/pull/383) Add load balancer cookies to the guidance page ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))



## v0.3.0-rc.72 (2020-09-24)

#### :rocket: Enhancement
* `sales-api-service`
  * [#382](https://github.com/DEFRA/rod-licensing/pull/382) Use NODE_ENV in environment name of service-status output ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.71 (2020-09-24)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#367](https://github.com/DEFRA/rod-licensing/pull/367) Bugfix: Junior Licences not tracked as sales ([@jaucourt](https://github.com/jaucourt))
  * [#364](https://github.com/DEFRA/rod-licensing/pull/364) Bugfix: Campaign values not registering in GA ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1
- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v0.3.0-rc.70 (2020-09-23)

#### :rocket: Enhancement
* `business-rules-lib`
  * [#378](https://github.com/DEFRA/rod-licensing/pull/378) Improve contact first/last name validation rules ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.69 (2020-09-23)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#374](https://github.com/DEFRA/rod-licensing/pull/374) Changes in view of Andrew Hick's test report; IWTF-1436 ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.68 (2020-09-22)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#373](https://github.com/DEFRA/rod-licensing/pull/373) Rebrand PDF printout to be EA rather than GDS ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.67 (2020-09-18)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#365](https://github.com/DEFRA/rod-licensing/pull/365) Fix length issue and add coverage ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.66 (2020-09-17)

#### :rocket: Enhancement
* `business-rules-lib`, `sales-api-service`
  * [#363](https://github.com/DEFRA/rod-licensing/pull/363) Revise contact name validation rules ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.65 (2020-09-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#360](https://github.com/DEFRA/rod-licensing/pull/360) Improve the look of the calendar control ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.64 (2020-09-17)

#### :rocket: Enhancement
* `dynamics-lib`, `pocl-job`, `sales-api-service`
  * [#361](https://github.com/DEFRA/rod-licensing/pull/361) Improvements to POCL loader to ensure process is resumable and improve efficiency  ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.63 (2020-09-16)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#358](https://github.com/DEFRA/rod-licensing/pull/358) Fix calendar noshow on IE11 ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.62 (2020-09-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#357](https://github.com/DEFRA/rod-licensing/pull/357) QA review of content ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.61 (2020-09-15)

#### :rocket: Enhancement
* `connectors-lib`, `pocl-job`
  * [#356](https://github.com/DEFRA/rod-licensing/pull/356) Add debug capability to sales-api-connector ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.60 (2020-09-15)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#353](https://github.com/DEFRA/rod-licensing/pull/353) Filter non-iso compliant entries from countries list ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.59 (2020-09-14)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`
  * [#345](https://github.com/DEFRA/rod-licensing/pull/345) Multiple frontend functional and content changes ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.58 (2020-09-14)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#352](https://github.com/DEFRA/rod-licensing/pull/352) Improve reliability and error handling of the POCL processor  ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.57 (2020-09-10)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#346](https://github.com/DEFRA/rod-licensing/pull/346) Add calendar control to licence start date page ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.56 (2020-09-08)

#### :rocket: Enhancement
* [#343](https://github.com/DEFRA/rod-licensing/pull/343) Add dependabot v2 config, improve jest performance when running in travis ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.55 (2020-09-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#324](https://github.com/DEFRA/rod-licensing/pull/324) Add encryption to session cookie ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))


## v0.3.0-rc.53 (2020-09-08)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#341](https://github.com/DEFRA/rod-licensing/pull/341)  Remove redundant redirects from contact pages ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.52 (2020-09-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#339](https://github.com/DEFRA/rod-licensing/pull/339) Fix DoB format string ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.51 (2020-09-07)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#338](https://github.com/DEFRA/rod-licensing/pull/338) Remove redundant redirects ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.50 (2020-09-07)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#336](https://github.com/DEFRA/rod-licensing/pull/336) Fix: all indirect methods of selecting a 12 month licence  ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.49 (2020-09-03)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`
  * [#326](https://github.com/DEFRA/rod-licensing/pull/326) Implement content changes from UCD ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.48 (2020-09-03)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#333](https://github.com/DEFRA/rod-licensing/pull/333) Allow server keep-alive to be configured for the frontend ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.47 (2020-08-26)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#325](https://github.com/DEFRA/rod-licensing/pull/325) Fix OIDC handler to handle accounts not present in Dynamics ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.45 (2020-08-24)

#### :rocket: Enhancement
* `dynamics-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  * [#318](https://github.com/DEFRA/rod-licensing/pull/318) Improve logging output when encountering errors persisting to Dynamics ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.44 (2020-08-24)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#317](https://github.com/DEFRA/rod-licensing/pull/317) Security headers ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.43 (2020-08-21)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#316](https://github.com/DEFRA/rod-licensing/pull/316) Changes to correct renewal start time logic and other changes ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))


## v0.3.0-rc.41 (2020-08-17)

#### :rocket: Enhancement
* `connectors-lib`, `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#312](https://github.com/DEFRA/rod-licensing/pull/312) OpenID Connect authentication and role based authorisation for telesales ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.40 (2020-08-17)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#310](https://github.com/DEFRA/rod-licensing/pull/310) Add pricing tables to the licence selection pages ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.39 (2020-08-14)

#### :bug: Bug Fix
* `pocl-job`
  * [#309](https://github.com/DEFRA/rod-licensing/pull/309) Correct use of moment-timezone for POCL record start-time ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.38 (2020-08-13)

#### :bug: Bug Fix
* `business-rules-lib`, `gafl-webapp-service`, `pocl-job`
  * [#307](https://github.com/DEFRA/rod-licensing/pull/307) Fix handling of date/times when running in docker container ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.37 (2020-08-13)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#304](https://github.com/DEFRA/rod-licensing/pull/304) Add constant for no. of minutes after payment and fix start date calculation ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.36 (2020-08-12)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`
  * [#302](https://github.com/DEFRA/rod-licensing/pull/302) Rework services to allow issue and expiry to be calculated after payment ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.35 (2020-08-11)

#### :rocket: Enhancement
* `dynamics-lib`, `gafl-webapp-service`
  * [#297](https://github.com/DEFRA/rod-licensing/pull/297) Front end journey redesign ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.34 (2020-08-06)

#### :rocket: Enhancement
* `dynamics-lib`, `gafl-webapp-service`, `sales-api-service`
  * [#295](https://github.com/DEFRA/rod-licensing/pull/295) Expose concession id in renewals authentication response ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.33 (2020-08-06)

#### :bug: Bug Fix
* [#287](https://github.com/DEFRA/rod-licensing/pull/287) Workaround for prettier-standard issues indenting ternary expressions ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.32 (2020-08-04)

#### :rocket: Enhancement
* `business-rules-lib`, `sales-api-service`
  * [#263](https://github.com/DEFRA/rod-licensing/pull/263) Prevent expletives from being generated in the licence number ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.30 (2020-08-04)

#### :rocket: Enhancement
* `sales-api-service`
  * [#286](https://github.com/DEFRA/rod-licensing/pull/286) Add validation to the Sales API config and convert types as required ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.29 (2020-08-04)

#### :rocket: Enhancement
* `dynamics-lib`, `fulfilment-job`, `sales-api-service`
  * [#284](https://github.com/DEFRA/rod-licensing/pull/284) Remove adal-node and replace with simple-oauth2 ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.28 (2020-08-04)

#### :rocket: Enhancement
* `sales-api-service`
  * [#277](https://github.com/DEFRA/rod-licensing/pull/277) Update sales-api to correctly set keep-alive timeout on the server listener ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.27 (2020-08-03)

#### :bug: Bug Fix
* `dynamics-lib`
  * [#276](https://github.com/DEFRA/rod-licensing/pull/276) Workaround for bug in adal-node failing to cache tokens and leaking memory ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.26 (2020-08-03)

#### :rocket: Enhancement
* `dynamics-lib`, `sales-api-service`
  * [#273](https://github.com/DEFRA/rod-licensing/pull/273) Add additional logging to track OAuth token refresh behaviour ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.25 (2020-07-31)

#### :rocket: Enhancement
* `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#272](https://github.com/DEFRA/rod-licensing/pull/272) Performance tuning of SQS integration and POCL job ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.24 (2020-07-31)

#### :rocket: Enhancement
* `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `sales-api-service`, `sqs-receiver-service`
  * [#269](https://github.com/DEFRA/rod-licensing/pull/269) Performance tuning improvements ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.23 (2020-07-29)

#### :rocket: Enhancement
* `connectors-lib`, `dynamics-lib`, `sales-api-service`
  * [#268](https://github.com/DEFRA/rod-licensing/pull/268) Network tuning parameters for AWS environment ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.22 (2020-07-29)

#### :bug: Bug Fix
* `connectors-lib`
  * [#267](https://github.com/DEFRA/rod-licensing/pull/267) Avoid attempting to consume the node-fetch response body twice ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.21 (2020-07-29)

#### :rocket: Enhancement
* `connectors-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#265](https://github.com/DEFRA/rod-licensing/pull/265) Add fallback response parser method to Sales API connector and revise logging ouput ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.20 (2020-07-28)

#### :rocket: Enhancement
* `sqs-receiver-service`
  * [#262](https://github.com/DEFRA/rod-licensing/pull/262) Only delay polling SQS after several receive message requests return no messages ([@sgardnerdell](https://github.com/sgardnerdell))

#### :bug: Bug Fix
* `sqs-receiver-service`
  * [#262](https://github.com/DEFRA/rod-licensing/pull/262) Only delay polling SQS after several receive message requests return no messages ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.19 (2020-07-28)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`
  * [#260](https://github.com/DEFRA/rod-licensing/pull/260) Adjust licence validator, introduce disinfect library, refactoring improvements ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))

## v0.3.0-rc.18 (2020-07-27)

#### :bug: Bug Fix
* `connectors-lib`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  * [#261](https://github.com/DEFRA/rod-licensing/pull/261) Fix issues in SQS receiver and Sales API connector ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.17 (2020-07-27)

#### :rocket: Enhancement
* `gafl-webapp-service`
  * [#241](https://github.com/DEFRA/rod-licensing/pull/241) Feature/fix backlink ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))








## v0.3.0-rc.9 (2020-07-17)

#### :bug: Bug Fix
* `gafl-webapp-service`
  * [#243](https://github.com/DEFRA/rod-licensing/pull/243) Fix issue with CSRF token when a custom CSRF cookie name is set ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))


## v0.3.0-rc.7 (2020-07-16)

#### :rocket: Enhancement
* `business-rules-lib`, `gafl-webapp-service`
  * [#238](https://github.com/DEFRA/rod-licensing/pull/238) Feature/easy renewal second phase ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1
- Graham Willis ([@graham-willis-druid](https://github.com/graham-willis-druid))
## v0.3.0-rc.5 (2020-07-15)

#### :rocket: Enhancement
* `sales-api-service`, `sqs-receiver-service`
  * [#239](https://github.com/DEFRA/rod-licensing/pull/239) Updates to support deployment into AWS ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.4 (2020-07-14)

#### :rocket: Enhancement

- `connectors-lib`, `fulfilment-job`, `pocl-job`
  - [#235](https://github.com/DEFRA/rod-licensing/pull/235) Migrate FTP server, POCL and Fulfilment services to use AWS SecretsManager ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.3 (2020-07-14)

#### :rocket: Enhancement

- `dynamics-lib`, `gafl-webapp-service`
  - [#236](https://github.com/DEFRA/rod-licensing/pull/236) Add support to authenticate with the configured redis instance ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.2 (2020-07-14)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  - [#237](https://github.com/DEFRA/rod-licensing/pull/237) Minor improvements to deployment configuration (both docker and npm) ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.3.0-rc.1 (2020-07-13)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#190](https://github.com/DEFRA/rod-licensing/pull/190) Implement Google Analytics ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1

- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v0.2.0 (2020-07-08)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  - [#228](https://github.com/DEFRA/rod-licensing/pull/228) Create new release ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.1.0 (2020-07-07)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`, `sqs-receiver-service`
  - [#227](https://github.com/DEFRA/rod-licensing/pull/227) Test release process ([@sgardnerdell](https://github.com/sgardnerdell))
  - [#225](https://github.com/DEFRA/rod-licensing/pull/225) Create release ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.57 (2020-06-30)

#### :bug: Bug Fix

- `gafl-webapp-service`, `sales-api-service`
  - [#204](https://github.com/DEFRA/rod-licensing/pull/204) Changes to renewals procedure: fixes and changes around non-mandatory fields ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.56 (2020-06-29)

#### :rocket: Enhancement

- `business-rules-lib`, `gafl-webapp-service`
  - [#203](https://github.com/DEFRA/rod-licensing/pull/203) Add an NI number validator ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.55 (2020-06-26)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#202](https://github.com/DEFRA/rod-licensing/pull/202) Allow senior and juniors access to disabled concessions ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.54 (2020-06-23)

#### :bug: Bug Fix

- `gafl-webapp-service`
  - [#201](https://github.com/DEFRA/rod-licensing/pull/201) Add test coverage for easy renewals /renew redirect handler ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.53 (2020-06-23)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `gafl-webapp-service`
  - [#199](https://github.com/DEFRA/rod-licensing/pull/199) Add support for easy renewals to the web journey ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.52 (2020-06-23)

#### :rocket: Enhancement

- `fulfilment-job`
  - [#200](https://github.com/DEFRA/rod-licensing/pull/200) Ensure errors uploading fulfilment data to S3 and FTP are properly trapped ([@sgardnerdell](https://github.com/sgardnerdell))
- Other
  - [#198](https://github.com/DEFRA/rod-licensing/pull/198) Revise git commit hooks to fix issues with sftp keys and secrets.env files ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.49 (2020-06-22)

#### :rocket: Enhancement

- `business-rules-lib`, `connectors-lib`, `gafl-webapp-service`, `pocl-job`, `sales-api-service`
  - [#196](https://github.com/DEFRA/rod-licensing/pull/196) Remove jest-each as this is natively supported by jest ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.48 (2020-06-22)

#### :rocket: Enhancement

- `connectors-lib`, `dynamics-lib`, `fulfilment-job`, `gafl-webapp-service`, `payment-mop-up-job`, `pocl-job`, `sales-api-service`
  - [#191](https://github.com/DEFRA/rod-licensing/pull/191) Implement fulfilment processor ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 1

- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.47 (2020-06-16)

#### :bug: Bug Fix

- `gafl-webapp-service`
  - [#189](https://github.com/DEFRA/rod-licensing/pull/189) Static files failing to serve ([@jaucourt](https://github.com/jaucourt))

#### Committers: 1

- Phil Benson ([@jaucourt](https://github.com/jaucourt))

## v0.0.1-beta.46 (2020-06-15)

#### :rocket: Enhancement

- `gafl-webapp-service`
  - [#188](https://github.com/DEFRA/rod-licensing/pull/188) Moved dob to licence summary and update contact preferences to reflect latest design ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### Committers: 1

- [@graham-willis-druid](https://github.com/graham-willis-druid)

## v0.0.1-beta.45 (2020-06-12)

#### :rocket: Enhancement

- `payment-mop-up-job`
  - [#182](https://github.com/DEFRA/rod-licensing/pull/182) Add docker support to the payment mopup service ([@graham-willis-druid](https://github.com/graham-willis-druid))

#### :bug: Bug Fix

- [#181](https://github.com/DEFRA/rod-licensing/pull/181) Fix configuration error in POCL docker-compose definition ([@sgardnerdell](https://github.com/sgardnerdell))

#### Committers: 2

- [@graham-willis-druid](https://github.com/graham-willis-druid)
- sgd ([@sgardnerdell](https://github.com/sgardnerdell))

## v0.0.1-beta.44 (2020-06-11)

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
