import pageHandler from '../page-handler.js'
import {
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  TERMS_AND_CONDITIONS
} from '../../uri.js'

jest.mock('../../uri.js', () => ({
  CONTACT_SUMMARY: { uri: '/path/to/contact/summary' },
  LICENCE_SUMMARY: { uri: '/path/to/licence/summary' },
  TERMS_AND_CONDITIONS: { uri: '/path/to/terms/and/conditions' },
  CONTROLLER: { uri: '/path/to/controller' }
}))

describe('Google analytics tracking', () => {
  it.each([
    {
      permitDescription: 'permit description',
      permitSubtypeLabel: 'subtype 1',
      numberOfRods: 1,
      permitTypeLabel: 'license 1',
      durationMagnitude: 12,
      durationDesignatorLabel: 'Parsecs(sic)',
      cost: 99.99,
      concessions: []
    },
    {
      permitDescription: 'permit description 2',
      permitSubtypeLabel: 'subtype 2',
      numberOfRods: 2,
      permitTypeLabel: 'license 3',
      durationMagnitude: 1,
      durationDesignatorLabel: 'Fortnight(s)',
      cost: 22.96,
      concessions: ['juniorSenior']
    },
    {
      permitDescription: 'permit description 3',
      permitSubtypeLabel: 'subtype 3',
      numberOfRods: 2,
      permitTypeLabel: 'license 4',
      durationMagnitude: 17,
      durationDesignatorLabel: 'Second(s)',
      cost: 122.96,
      concessions: ['subsidy']
    }
  ])(`sends ecommerce detail view on ${CONTACT_SUMMARY.uri}`, async (permission) => {
    const transaction = getSampleTransaction({ permissions: [getSamplePermission(permission)] })
    const request = getMockRequest(transaction)

    await pageHandler(CONTACT_SUMMARY.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.detail).toHaveBeenCalledWith(
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

  it.each([
    {
      permitDescription: 'permit description',
      permitSubtypeLabel: 'subtype 1',
      numberOfRods: 1,
      permitTypeLabel: 'license 1',
      durationMagnitude: 12,
      durationDesignatorLabel: 'Parsecs(sic)',
      cost: 99.99,
      concessions: []
    },
    {
      permitDescription: 'permit description 2',
      permitSubtypeLabel: 'subtype 2',
      numberOfRods: 2,
      permitTypeLabel: 'license 3',
      durationMagnitude: 1,
      durationDesignatorLabel: 'Fortnight(s)',
      cost: 22.96,
      concessions: ['juniorSenior']
    },
    {
      permitDescription: 'permit description 3',
      permitSubtypeLabel: 'subtype 3',
      numberOfRods: 2,
      permitTypeLabel: 'license 4',
      durationMagnitude: 17,
      durationDesignatorLabel: 'Second(s)',
      cost: 122.96,
      concessions: ['subsidy']
    }
  ])(`sends ecommerce detail view on ${LICENCE_SUMMARY.uri}`, async (permission) => {
    const transaction = getSampleTransaction({ permissions: [getSamplePermission(permission)] })
    const request = getMockRequest(transaction)

    await pageHandler(LICENCE_SUMMARY.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.detail).toHaveBeenCalledWith(
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

  it.each([
    {
      permitDescription: 'permit description',
      permitSubtypeLabel: 'subtype 1',
      numberOfRods: 1,
      permitTypeLabel: 'license 1',
      durationMagnitude: 12,
      durationDesignatorLabel: 'Parsecs(sic)',
      cost: 99.99,
      concessions: []
    },
    {
      permitDescription: 'permit description 2',
      permitSubtypeLabel: 'subtype 2',
      numberOfRods: 2,
      permitTypeLabel: 'license 3',
      durationMagnitude: 1,
      durationDesignatorLabel: 'Fortnight(s)',
      cost: 22.96,
      concessions: ['juniorSenior']
    },
    {
      permitDescription: 'permit description 3',
      permitSubtypeLabel: 'subtype 3',
      numberOfRods: 2,
      permitTypeLabel: 'license 4',
      durationMagnitude: 17,
      durationDesignatorLabel: 'Second(s)',
      cost: 122.96,
      concessions: ['subsidy']
    }
  ])(`sends ecommerce addToCart on ${TERMS_AND_CONDITIONS.uri}`, async (permission) => {
    const transaction = getSampleTransaction({ permissions: [getSamplePermission(permission)] })
    const request = getMockRequest(transaction)

    await pageHandler(TERMS_AND_CONDITIONS.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.addToCart).toHaveBeenCalledWith(
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

  it.each([
    '/buy/any',
    '/buy/other',
    '/buy/uri'
  ])('doesn\'t send ecommerce events for other URIs', async (uri) => {
    const request = getMockRequest()
    await pageHandler(uri).get(request, getMockResponseToolkit())
    expect(request.ga.ecommerce).not.toHaveBeenCalled()
  })
})

const getMockRequest = (transaction = getSampleTransaction()) => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: () => Promise.resolve({})
      },
      status: {
        getCurrentPermission: () => Promise.resolve({}),
        setCurrentPermission: () => Promise.resolve()
      },
      transaction: {
        get: jest.fn(() => transaction),
        set: () => {}
      }
    }
  })),
  ga: {
    ecommerce: jest.fn(() => ({
      detail: jest.fn(),
      addToCart: jest.fn()
    }))
  }
})

const getMockResponseToolkit = () => ({
  redirect: () => {},
  view: () => {}
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
  cost = 1,
  payment_id = 'aaa111'
} = {}) => ({
  payment: {
    payment_id
  },
  permissions,
  id,
  cost
})
