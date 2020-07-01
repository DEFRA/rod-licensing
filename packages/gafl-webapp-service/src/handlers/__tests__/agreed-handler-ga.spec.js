import agreedHandler from '../agreed-handler.js'
import { COMPLETION_STATUS } from '../../constants.js'
import { sendPayment } from '../../services/payment/govuk-pay-service.js'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/payment.js')
jest.mock('../../services/payment/govuk-pay-service.js', () => ({
  sendPayment: jest.fn(() => ({
    payment_id: 'aaa-111',
    created_date: '2020-08-01T12:51:12.000',
    state: 'what a',
    payment_provider: 'IOU',
    _links: {
      next_url: {
        href: '/exciting/things/here'
      },
      self: {
        href: '/its/full/of/stars'
      }
    }
  })),
  getPaymentStatus: () => {}
}))

describe('Google Analytics for agreed handler', () => {
  it.each([
    {
      permitDescription: 'permit description',
      permitSubtypeLabel: 'subtype 1',
      numberOfRods: 1,
      permitTypeLabel: 'license 1',
      durationMagnitude: 12,
      durationDesignatorLabel: 'Month(s)',
      cost: 1.87,
      concessions: []
    },
    {
      permitDescription: 'permit description 2',
      permitSubtypeLabel: 'subtype 2',
      numberOfRods: 2,
      permitTypeLabel: 'license 3',
      durationMagnitude: 12,
      durationDesignatorLabel: 'Day(s)',
      cost: 22.96,
      concessions: ['threat of physical violence']
    },
    {
      permitDescription: 'permit description 3',
      permitSubtypeLabel: 'subtype 3',
      numberOfRods: 2,
      permitTypeLabel: 'license 4',
      durationMagnitude: 17,
      durationDesignatorLabel: 'Second(s)',
      cost: 122.96,
      concessions: ['bribery', 'corruption']
    }
  ])('sends checkout event with expected data when payment sent', async (permission) => {
    const transaction = getSampleTransaction({ permissions: [getSamplePermission(permission)] })
    console.log('transaction', transaction.permissions[0])
    const request = getMockRequest(transaction)

    await agreedHandler(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.checkout).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: permission.permitDescription,
          name: `${permission.permitSubtypeLabel} - ${permission.numberOfRods} rod(s) licence`,
          brand: permission.permitTypeLabel,
          category: `${permission.permitSubtypeLabel}/${permission.numberOfRods} rod(s)/${permission.concessions.length ? permission.concessions.join(',') : 'Full'}`,
          variant: `${permission.durationMagnitude} ${permission.durationDesignatorLabel}`,
          quantity: 1,
          price: permission.cost
        })
      ])
    )
  })
})

const getMockRequest = (transaction = getSampleTransaction()) => ({
  cache: jest.fn(() => ({
    helpers: {
      status: {
        get: jest.fn(() => ({
          [COMPLETION_STATUS.agreed]: true,
          [COMPLETION_STATUS.posted]: true,
          [COMPLETION_STATUS.paymentCreated]: false
        })),
        set: () => {}
      },
      transaction: {
        get: jest.fn(() => transaction),
        set: () => {}
      }
    }
  })),
  ga: {
    ecommerce: jest.fn(() => ({
      checkout: jest.fn()
    }))
  }
})

const getMockResponseToolkit = () => ({
  redirect: () => {}
})

const getSamplePermission = ({
  permitDescription = 'Salmon 1 day 1 Rod Licence (Full)',
  permitSubtypeLabel = 'Salmon and sea trout',
  numberOfRods = 1,
  permitTypeLabel = 'Rod Fishing Licence',
  durationMagnitude = 12,
  durationDesignatorLabel = 'Month(s)',
  cost = 1,
  concessions = []
} = {}) => ({
  permit: {
    description: permitDescription,
    permitSubtype: {
      label: permitSubtypeLabel
    },
    numberOfRods,
    permitType: {
      label: permitTypeLabel
    },
    durationMagnitude,
    durationDesignator: {
      label: durationDesignatorLabel
    },
    cost,
    concessions
  }
})

const getSampleTransaction = ({
  permissions = [getSamplePermission()],
  id = 'fff-111-eee-222',
  cost = 1
} = {}) => ({
  payment: {},
  permissions,
  id,
  cost
})
