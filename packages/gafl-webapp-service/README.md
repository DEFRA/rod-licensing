# gafl-webapp-service

## Environment variables

| name                | description                                   | required | default  | valid                         |
| ------------------- | --------------------------------------------- | :------: | -------- | ----------------------------- |
| NODE_ENV            | Node environment                              |    no    |          | development, test, production |
| SESSION_COOKIE_NAME | Name of the session cookie                    |    no    | sid      |                               |
| SESSION_TTL_MS      | Time to live for the session cookie and cache |    no    | 10800000 |                               |
| ADDRESS_LOOKUP_URL  | Location of address lookup facade             |    no    |          |                               |
| ADDRESS_LOOKUP_KEY  | The API key required by OS places             |    no    |          |                               |
| ADDRESS_LOOKUP_MS   | The timeout in milliseconds for the lookup    |    no    | 10000    |                               |

## OS Places address lookup

The address lookup can be port-forwarded locally to test the find-address page with a command similar to the following;

`ssh -L 9002:fsh-dev-bes.aws-int.defra.cloud:9002 DEVFSHFESSRV001`

Where `DEVFSHFESSRV001` is a development instance with access to the facade. Details can be found here https://rattic-ops.aws-int.defra.cloud/cred/detail/2287/ . Don't forget to start the environment!

Then set the URL as follows

`set ADDRESS_LOOKUP_URL=http://localhost:9002/address-service/v1/addresses/postcode-and-premises`

An address lookup key will also need to be set.
