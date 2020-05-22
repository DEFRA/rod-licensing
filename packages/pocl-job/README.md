# Rod Licensing - Post Office Counter Licence Sales Processor

The pocl-job package handles processing of Post Office Counter Licence sales files

# Environment variables

| name                      | description                                              | required | default   | valid                         | notes |
| ------------------------- | -------------------------------------------------------- | :------: | --------- | ----------------------------- | ----- |
| NODE_ENV                  | Node environment                                         |    no    |           | development, test, production |       |
| POCL_FILE_STAGING_TABLE   | The DynamoDB table used for staging POCL files           |   yes    |           |                               |       |
| POCL_RECORD_STAGING_TABLE | The DynamoDB table used for staging POCL records         |   yes    |           |                               |       |
| POCL_STAGING_TTL          | The time to live for records in the either staging table |    no    | 168 hours |                               |       |

###See also:

- Environment variables [required by the connectors-lib package](../connectors-lib/README.md).

# Prerequisites

See [main project documentation](../../README.md).
