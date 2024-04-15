# Rod Licensing - Recurring Payments

After taking the initial payment, a recurring payment will be setup in a new CRM entity.

The Recurring Payments (RP) job, running on a regular schedule instructs GovPay to take payment for all non cancelled recurring payments due on the day

When the RP job runs, all RP entries with an nextDueDate of the current date, a null cancelledDate and an active ('1') status field are retrieved, along with the associated Permissions. A new Permission for an identical Permit with a startDate equal to the endDate of the activePermission is provisioned and payment taken via the Gov.UK Pay interface.

# Environment variables

| name                           | description                                                     | required | default             | valid                         | notes                                                                             |
| ------------------------------ | --------------------------------------------------------------- | :------: | ------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| NODE_ENV                       | Node environment                                                |    no    |                     | development, test, production |                                                                                   |
| RUN_RECURRING_PAYMENTS         | Determine whether to run recurring payments job or not          |   yes    |                     |                               |                                                                                   |
| SALES_API_URL                  | URL for the sales API                                           |    no    | http://0.0.0.0:4000 |                               |                                                                                   |
| SALES_API_TIMEOUT_MS           | The timeout in milliseconds requests to the API                 |    no    | 10000               |                               |                                                                                   |
| OAUTH_AUTHORITY_HOST_URL       | OAuth 2.0 authority host                                        |   yes    |                     |                               |                                                                                   |
| OAUTH_TENANT                   | OAuth 2.0 tenant                                                |   yes    |                     |                               |                                                                                   |
| OAUTH_CLIENT_ID                | OAuth 2.0 client ID for client credentials flow                 |   yes    |                     |                               |                                                                                   |
| OAUTH_CLIENT_SECRET            | OAuth 2.0 client secret for client credentials flow             |   yes    |                     |                               |                                                                                   |
| OAUTH_SCOPE                    | OAuth 2.0 scope to request (client credentials resource)        |   yes    |                     |                               |                                                                                   |
| DYNAMICS_API_PATH              | Full URL to the Dynamics API                                    |   yes    |                     |                               | The full URL to the dynamics web api. e.g. https://dynamics-server/api/data/v9.1/ |
| DYNAMICS_API_VERSION           | The version of the Dynamics API                                 |   yes    |                     |                               | The version of the dynamics web api. e.g. 9.1                                     |
| 1                              |
| RECURRING_PAYMENTS_LOCAL_DELAY | Delay for running recurring payments until sales api is running |    no    |                     |                               |

### See also:

-

# Prerequisites

See [main project documentation](../../README.md).
