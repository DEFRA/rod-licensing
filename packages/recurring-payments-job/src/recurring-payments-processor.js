import moment from 'moment-timezone'
import { PAYMENT_TYPE, TRANSACTION_SOURCE } from '@defra-fish/business-rules-lib'
import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'

export const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = new Date().toISOString().split('T')[0]
    const response = await salesApi.getDueRecurringPayments(date)
    console.log('Recurring Payments found: ', response)
    await Promise.all(response.map(record => processRecurringPayment(record)))
  } else {
    console.log('Recurring Payments job disabled')
  }
}

const processRecurringPayment = async record => {
  const referenceNumber = record.expanded.activePermission.entity.referenceNumber
  const transactionData = await processPermissionData(referenceNumber) // prepares transaction data ?
  console.log('Creating new transaction based on', referenceNumber)
  try {
    const transactionResponse = await salesApi.createTransaction(transactionData) // creates transaction ?
    console.log('New transaction created:', transactionResponse)
    const paymentResponse = await sendPaymentRequest(transactionResponse) // sends payment request ?
    console.log('Payment request sent:', paymentResponse)
    await processPaymentResults({ id: transactionResponse.id, paymentStatus: paymentResponse }) // processes payment results ?
  } catch (e) {
    console.log('Error creating transaction or sending payment request', JSON.stringify(transactionData))
    throw e
  }
}

const processPermissionData = async referenceNumber => {
  console.log('Preparing data based on', referenceNumber)
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const licenseeWithoutCountryCode = Object.assign((({ countryCode: _countryCode, ...l }) => l)(data.licensee))
  return {
    dataSource: 'Recurring Payment',
    permissions: [
      {
        isLicenceForYou: data.isLicenceForYou,
        isRenewal: data.isRenewal,
        issueDate: null,
        licensee: licenseeWithoutCountryCode,
        permitId: data.permitId,
        startDate: prepareStartDate(data),
        amount: data.amount
      }
    ]
  }
}

const prepareStartDate = permission => {
  return moment
    .tz(permission.licenceStartDate, 'YYYY-MM-DD')
    .add(permission.licenceStartTime ?? 0, 'hours')
    .utc()
    .toISOString()
}

const sendPaymentRequest = async transaction => {
  const paymentRequestData = {
    amount: transaction.permissions[0].amount, // pulls amount from the transaction data
    reference: transaction.id,
    description: 'Renewal payment',
    return_url: `${process.env.RETURN_URL}/payment-status`
  }

  const response = await govUkPayApi.createPayment(paymentRequestData) // sends payment request to govukpay API >
  const paymentResponse = await response.json()
  return paymentResponse
}

const processPaymentResults = async transaction => {
  if (transaction.paymentStatus.state?.status === 'error') {
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Failed' })
  }

  if (transaction.paymentStatus.state?.status === 'success') {
    await salesApi.finaliseTransaction(transaction.id, {
      payment: {
        amount: transaction.paymentStatus.amount,
        timestamp: transaction.paymentStatus.transactionTimestamp,
        source: TRANSACTION_SOURCE.govPay,
        method: PAYMENT_TYPE.debit
      }
    })
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Completed' })
  } else {
    if (transaction.paymentStatus.state?.code === 'P0030') {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Expired' })
    }

    if (transaction.paymentStatus.state?.code === 'P0020') {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Cancelled' })
    }

    if (transaction.paymentStatus.state?.code === 'P0010') {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Failed' })
    }

    if (
      transaction.paymentStatus.code === 'P0040' &&
      moment().diff(moment(transaction.paymentTimestamp), 'hours') >= 3
    ) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: 'Expired' })
    }
  }
}
