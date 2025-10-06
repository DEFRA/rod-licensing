# gafl-webapp-service

The web and telesales service buying a rod fishing licence; for https://www.gov.uk/fishing-licences

To run from this directory:

`node src/gafl-webapp-service.js`

## Environment variables

| name                              | description                                                      | required | default                                                   | valid                         |
| --------------------------------- | ---------------------------------------------------------------- | :------: | --------------------------------------------------------- | ----------------------------- |
| NODE_ENV                          | Node environment                                                 |    no    |                                                           | development, test, production |
| HAPI_KEEP_ALIVE_TIMEOUT_MS        | Configure the keep-alive timeout on the server listener          |    no    | 1 minute                                                  |                               |
| PORT                              | The http port the listens on                                     |    no    | 3000                                                      |                               |
| REDIS_HOST                        | Hostname of the redis instance used for session caching          |   yes    |                                                           |                               |
| REDIS_PORT                        | Port number of the redis instance used for session caching       |    no    | 6379                                                      |                               |
| REDIS_PASSWORD                    | Password used to authenticate with the configured redis instance |    no    |                                                           |                               |
| CHANNEL                           | The sales channel                                                |    no    | websales                                                  | websales, telesales           |
| SESSION_COOKIE_NAME               | Name of the session cookie                                       |    no    | sid                                                       |                               |
| CSRF_TOKEN_COOKIE_NAME            | Name of the CSRF token cookie                                    |    no    | rlsctkn                                                   |                               |
| SESSION_COOKIE_PASSWORD           | Encryption key for the session cookie (at least 32 characters)   |   yes    |                                                           |                               |
| SESSION_TTL_MS                    | Time to live for the session cookie and cache                    |    no    | 10800000                                                  |                               |
| ADDRESS_LOOKUP_URL                | Location of address lookup facade                                |    no    |                                                           |                               |
| ADDRESS_LOOKUP_KEY                | The API key required by OS places                                |    no    |                                                           |                               |
| ADDRESS_LOOKUP_TIMEOUT_MS         | The timeout in milliseconds for the lookup                       |    no    | 10000                                                     |                               |
| SALES_API_URL                     | The address of the sales api                                     |    no    | http://0.0.0.0:4000                                       |                               |
| SALES_API_TIMEOUT_MS              | The timeout in milliseconds requests to the api                  |    no    | 10000                                                     |                               |
| GOV_PAY_API_URL                   | The GOV.UK Pay API base url                                      |    no    | Yes                                                       |                               |
| GOV_PAY_APIKEY                    | GOV pay access identifier                                        |    no    | Yes                                                       |                               |
| GOV_PAY_REQUEST_TIMEOUT_MS        | Timeout in milliseconds for API requests                         |    no    | Yes                                                       |                               |
| FEEDBACK_URI                      | Location of feedback survey                                      |    no    | #                                                         |                               |
| ANALYTICS_PRIMARY_PROPERTY        | Analytics ID for tracking inc ecommerce                          |    no    |                                                           |                               |
| ANALYTICS_PROPERTY_API            | Analytics property API key for linking Analytics.google property |    no    |                                                           |                               |
| SERVICE_PAGE                      | GOV.UK service page                                              |    no    | https://www.gov.uk/fishing-licences/buy-a-fishing-licence |                               |
| AIRBRAKE_HOST                     | URL of airbrake host                                             |    no    |                                                           |                               |
| AIRBRAKE_PROJECT_KEY              | Project key for airbrake logging                                 |    no    |                                                           |                               |
| SHOW_WELSH_CONTENT                | Display option to change to welsh language                       |    no    |                                                           |                               |
| ENABLE_ANALYTICS_OPT_IN_DEBUGGING | Set log if analytics been checked in non-production              |    no    |                                                           |                               |
| ERROR_PAGE_ROUTE                  | Display error pages to support welsh language                    |    no    |                                                           |                               |
| SHOW_RECURRING_PAYMENTS           | Display option to show recurring payments journey                |    no    |                                                           |                               |
| SHOW_CANCELLATION_JOURNEY         | Display option to show recurring payments cancellation journey   |    no    |                                                           |                               |

## OS Places address lookup

The address lookup can be port-forwarded locally to test the find-address page with a command similar to the following;

`ssh -L 9002:TSFSAB01:9002 TSFSWS01`

Where `TSFSWS01` is a development instance with access to the facade at `TSFSAB01`. Details can be found here https://rattic-ops.aws-int.defra.cloud/cred/detail/1713/ . Don't forget to start the environment!

Then set the URL as follows

`set ADDRESS_LOOKUP_URL=http://localhost:9002/address-service/v1/addresses/postcode-and-premises`

An address lookup key will also need to be set.

## GOV.UK pay setup

The details of the GOV.UK payment API can be found here; https://docs.payments.service.gov.uk/#gov-uk-pay-technical-documentation
