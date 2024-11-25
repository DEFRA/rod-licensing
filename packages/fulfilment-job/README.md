# Rod Licensing - Fulfilment Processor

The fulfilment-job package handles the delivery of fulfilment requests to the fulfilment provider via FTP.

Fulfilment is where a licence card and an accompanying letter are posted to an angler who has purchased a licence.

This job will query the configured Microsoft Dynamics instance for fulfilment requests which have not yet been associated with a fulfilment request
file. Each outstanding fulfilment request is staged into AWS S3.

The initial export phase writes fulfilment requests into 'part files'. This is due to limitations in the number of requests that can be sent to
Microsoft Dynamics in a batch transaction. Currently that limit is 1000 requests and for each batch of 1000 one request in required to create/update
the fulfilment file entity, leaving 999 requests available to associate the fulfilment requests which were written to the part file with the
fulfilment file entity. This means that each part file may contain up to 999 fulfilment request records. Multiple part files may be written
for each fulfilment file depending on the configured FULFILMENT_FILE_SIZE.

After the export phase has completed, the delivery phase retrieves all of the part files from AWS S3 and aggregates these into the final fulfilment
files to be delivered. The aggregated files and corresponding sha256 hashes are written to both AWS S3 and to the FTP server of the fulfilment
provider.

# Environment variables

| name                                | description                                                                   | required | default | valid                                                                   | notes |
| ----------------------------------- | ----------------------------------------------------------------------------- | :------: | ------- | ----------------------------------------------------------------------- | ----- |
| NODE_ENV                            | Node environment                                                              |    no    |         | development, test, production                                           |       |
| FULFILMENT_FILE_SIZE                | The maximum number of records written to an aggregated fulfilment file        |   yes    |         |                                                                         |       |
| FULFILMENT_S3_BUCKET                | The name of the AWS S3 bucket in which to stage and aggregate fulfilment data |   yes    |         |                                                                         |       |
| FULFILMENT_SEND_UNENCRYPTED_FILE    | Flag for whether to send the unencrypted fulfilment file                      |    no    | false   | true, false, 0, 1                                                       |       |
| FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID | The secret id for the file encryption public key                              |   yes    |         |                                                                         |       |
| DEBUG                               | Use to enable output of debug information to the console                      |   yes    |         | fulfilment:\*, fulfilment:staging, fulfilment:transport, fulfilment:ftp |       |
| AIRBRAKE_HOST                       | URL of airbrake host                                                          |    no    |         |                                                                         |       |
| AIRBRAKE_PROJECT_KEY                | Project key for airbrake logging                                              |    no    |         |                                                                         |       |

### See also:

- Environment variables [required by the connectors-lib package](../connectors-lib/README.md).

# Prerequisites

See [main project documentation](../../README.md).
