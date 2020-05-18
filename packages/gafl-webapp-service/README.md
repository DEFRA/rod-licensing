# gafl-webapp-service

The web and telesales service buying a rod fishing licence; for https://www.gov.uk/fishing-licences

To run from this directory:

`node src/gafl-webapp-service.js`

## Environment variables

| name                       | description                                     | required | default             | valid                         |
| -------------------------- | ----------------------------------------------- | :------: | ------------------- | ----------------------------- |
| NODE_ENV                   | Node environment                                |    no    |                     | development, test, production |
| SESSION_COOKIE_NAME        | Name of the session cookie                      |    no    | sid                 |                               |
| SESSION_TTL_MS             | Time to live for the session cookie and cache   |    no    | 10800000            |                               |
| ADDRESS_LOOKUP_URL         | Location of address lookup facade               |    no    |                     |                               |
| ADDRESS_LOOKUP_KEY         | The API key required by OS places               |    no    |                     |                               |
| ADDRESS_LOOKUP_TIMEOUT_MS  | The timeout in milliseconds for the lookup      |    no    | 10000               |                               |
| SALES_API_URL              | The address of the sales api                    |    no    | http://0.0.0.0:4000 |                               |
| SALES_API_TIMEOUT_MS       | The timeout in milliseconds requests to the api |    no    | 10000               |                               |
| GOV_PAY_API_URL            | The GOV.UK Pay API base url                     |    no    |                     |                               |
| GOV_PAY_HTTPS_REDIRECT     | Protcol for the post payment redirect           |    no    |                     |                               |
| GOV_PAY_APIKEY             | GOV pay access identifier                       |    no    |                     |                               |
| GOV_PAY_REQUEST_TIMEOUT_MS | Timeout in milliseconds for API requests        |    no    |                     |                               |
| HOST_URL                   | Submitted to GOV.UK Pay - the redirect URL      |    no    | http://0.0.0.0:3000 |                               |

## OS Places address lookup

The address lookup can be port-forwarded locally to test the find-address page with a command similar to the following;

`ssh -L 9002:fsh-dev-bes.aws-int.defra.cloud:9002 DVFSWS01`

Where `DVFSWS01` is a development instance with access to the facade. Details can be found here https://rattic-ops.aws-int.defra.cloud/cred/detail/2287/ . Don't forget to start the environment!

Then set the URL as follows

`set ADDRESS_LOOKUP_URL=http://localhost:9002/address-service/v1/addresses/postcode-and-premises`

An address lookup key will also need to be set.

## GOV.UK pay setup

The details of the GOV.UK payment API can be found here; https://docs.payments.service.gov.uk/#gov-uk-pay-technical-documentation
