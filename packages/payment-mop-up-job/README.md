# payment-mop-up-job

Where a user does not complete the web-sales user journey after a successful payment this process will
query the GOV.UK API for the status of those payments. If a payment has been completed the mop-up job will 
complete the payment automatically
  
`node src/payment-mop-up-job.js [--age-minutes <number>] [--scan-duration-hours <number>]`

The age is the time elapsed since the payment was created when the transaction becomes eligible for the mop up process. 
It defaults to 180 minutes - 3 hours.

The scan duration is the interval over which the transaction will be queried. For example if with a max age of 180 minutes
and a scan duration of 24 hours then candidate transactions are those started between 27 and 24 hours ago. 
The scan duration should be larger than the periodicity of the job to provide continuous coverage of all transactions. 
Since the job will not process the same transaction twice.

## Environment variables

| name                       | description                                     | required | default             | valid                         |
| -------------------------- | ----------------------------------------------- | :------: | ------------------- | ----------------------------- |
| NODE_ENV                   | Node environment                                |    no    |                     | development, test, production |
| SALES_API_URL              | The address of the sales api                    |    no    | http://0.0.0.0:4000 |                               |
| SALES_API_TIMEOUT_MS       | The timeout in milliseconds requests to the api |    no    | 10000               |                               |
| GOV_PAY_API_URL            | The GOV.UK Pay API base url                     |    no    | Yes                 |                               |
| GOV_PAY_APIKEY             | GOV pay access identifier                       |    no    | Yes                 |                               |
| GOV_PAY_REQUEST_TIMEOUT_MS | Timeout in milliseconds for API requests        |    no    | Yes                 |                               |

The details of the GOV.UK payment API can be found here; https://docs.payments.service.gov.uk/#gov-uk-pay-technical-documentation
