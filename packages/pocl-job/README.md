# Rod Licensing - Post Office Counter Licence Sales Processor

The pocl-job package handles processing of Post Office Counter Licence sales files.

The job will retrieve POCL XML files from the configured FTP server and download these into AWS S3.

Each XML file is subsequently parsed and the payload is transformed into the required JSON format to be passed to the Sales API. DynamoDB is used
to maintain state during the import process.

# Environment variables

| name                      | description                                                                         | required | default   | valid                                           | notes |
| ------------------------- | ----------------------------------------------------------------------------------- | :------: | --------- | ----------------------------------------------- | ----- |
| NODE_ENV                  | Node environment                                                                    |    no    |           | development, test, production                   |       |
| POCL_FILE_STAGING_TABLE   | The DynamoDB table used for staging POCL files                                      |   yes    |           |                                                 |       |
| POCL_RECORD_STAGING_TABLE | The DynamoDB table used for staging POCL records                                    |   yes    |           |                                                 |       |
| POCL_STAGING_TTL          | The time to live for records in either staging table                                |    no    | 168 hours |                                                 |       |
| POCL_FTP_HOST             | The hostname of the target FTP server                                               |   yes    |           |                                                 |       |
| POCL_FTP_PORT             | The port of the FTP service on the target server                                    |   yes    |           |                                                 |       |
| POCL_FTP_PATH             | The base path under which files should be written to the FTP server                 |   yes    |           |                                                 |       |
| POCL_FTP_USERNAME         | The username used to authenticate with the FTP server                               |   yes    |           |                                                 |       |
| POCL_FTP_PRIVATE_KEY_PATH | The path to the folder containing the keys used to authenticate with the FTP server |   yes    |           |                                                 |       |
| POCL_S3_BUCKET            | The name of the AWS S3 bucket in which to stage pocl data                           |   yes    |           |                                                 |       |
| DEBUG                     | Use to enable output of debug information to the console                            |   yes    |           | pocl:\*, pocl:staging, pocl:transport, pocl:ftp |       |
| AIRBRAKE_HOST             | URL of airbrake host                                                                |    no    |           |                                                 |       |
| AIRBRAKE_PROJECT_KEY      | Project key for airbrake logging                                                    |    no    |           |                                                 |       |

### See also:

- Environment variables [required by the connectors-lib package](../connectors-lib/README.md).

# Prerequisites

See [main project documentation](../../README.md).
