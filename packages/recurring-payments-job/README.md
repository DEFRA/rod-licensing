# Rod Licensing - Recurring Payments

After taking the initial payment, a recurring payment will be setup in a new CRM entity.

The Recurring Payments (RP) job, running on a regular schedule instructs GovPay to take payment for all non cancelled recurring payments due on the day

When the RP job runs, all RP entries with an nextDueDate of the current date, a null cancelledDate and an active ('1') status field are retrieved, along with the associated Permissions. A new Permission for an identical Permit with a startDate equal to the endDate of the activePermission is provisioned and payment taken via the Gov.UK Pay interface.

# Environment variables

| name                                | description                                                                               | required | default | valid                                                                   | notes |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | :------: | ------- | ----------------------------------------------------------------------- | ----- |
| NODE_ENV                            | Node environment                                                                          | no    |         | development, test, production                                           |       |
| RUN_RECURRING_PAYMENTS              | Determine whether to run recurring payments job or not                                    |   yes   |         |   

### See also:

-

# Prerequisites

See [main project documentation](../../README.md).
