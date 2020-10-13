import { dobHelper, JUNIOR_TODAY, ADULT_TODAY, SENIOR_TODAY } from '../../__mocks__/test-utils-business-rules.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../__mocks__/test-utils-system.js'
import { licenseTypes } from '../../pages/licence-details/licence-type/route.js'

import {
  LICENCE_TO_START,
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  CONTROLLER,
  DISABILITY_CONCESSION,
  GET_PRICING_TYPES,
  GET_PRICING_LENGTHS
} from '../../uri.js'

import { licenceToStart } from '../../pages/licence-details/licence-to-start/update-transaction.js'
import { disabilityConcessionTypes } from '../../pages/concessions/disability/update-transaction.js'

mockSalesApi()

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const juniorPricingByType = {
  [licenseTypes.troutAndCoarse2Rod]: {
    '12M': {
      cost: 0,
      concessions: true
    },
    msg: 'no-short'
  },
  [licenseTypes.troutAndCoarse3Rod]: {
    '12M': {
      cost: 0,
      concessions: true
    },
    msg: 'no-short'
  },
  [licenseTypes.salmonAndSeaTrout]: {
    '12M': {
      cost: 0,
      concessions: true
    },
    msg: 'no-short'
  }
}

const adultPricingByType = {
  [licenseTypes.salmonAndSeaTrout]: {
    '12M': {
      cost: 82,
      concessions: false
    },
    '8D': {
      cost: 27,
      concessions: false
    },
    '1D': {
      cost: 12,
      concessions: false
    }
  },
  [licenseTypes.troutAndCoarse3Rod]: {
    '12M': {
      cost: 45,
      concessions: false
    },
    msg: 'no-short'
  },
  [licenseTypes.troutAndCoarse2Rod]: {
    '12M': {
      cost: 30,
      concessions: false
    },
    '8D': {
      cost: 12,
      concessions: false
    },
    '1D': {
      cost: 6,
      concessions: false
    }
  }
}

const adultDisabledPricingByType = {
  [licenseTypes.salmonAndSeaTrout]: {
    '12M': {
      cost: 54,
      concessions: true
    },
    '8D': {
      cost: 27,
      concessions: false
    },
    '1D': {
      cost: 12,
      concessions: false
    }
  },
  [licenseTypes.troutAndCoarse3Rod]: {
    '12M': {
      cost: 30,
      concessions: true
    },
    msg: 'no-short'
  },
  [licenseTypes.troutAndCoarse2Rod]: {
    '12M': {
      cost: 20,
      concessions: true
    },
    '8D': {
      cost: 12,
      concessions: false
    },
    '1D': {
      cost: 6,
      concessions: false
    }
  }
}

const seniorPricingByType = {
  [licenseTypes.salmonAndSeaTrout]: {
    '12M': {
      cost: 54,
      concessions: true
    },
    '8D': {
      cost: 27,
      concessions: false
    },
    '1D': {
      cost: 12,
      concessions: false
    }
  },
  [licenseTypes.troutAndCoarse3Rod]: {
    '12M': {
      cost: 30,
      concessions: true
    },
    msg: 'no-short'
  },
  [licenseTypes.troutAndCoarse2Rod]: {
    '12M': {
      cost: 20,
      concessions: true
    },
    '8D': {
      cost: 12,
      concessions: false
    },
    '1D': {
      cost: 6,
      concessions: false
    }
  }
}

const juniorPricingByLength = {
  '12M': {
    total: {
      cost: 0,
      concessions: true
    }
  }
}

const adultPricingByLength = {
  '12M': {
    total: {
      cost: 30,
      concessions: false
    }
  },
  '8D': {
    total: {
      cost: 12,
      concessions: false
    }
  },
  '1D': {
    total: {
      cost: 6,
      concessions: false
    }
  }
}
const adultDisabledPricingByLength = {
  '12M': {
    total: {
      cost: 20,
      concessions: true
    }
  },
  '8D': {
    total: {
      cost: 12,
      concessions: false
    }
  },
  '1D': {
    total: {
      cost: 6,
      concessions: false
    }
  }
}

const seniorPricingByLength = {
  '12M': {
    total: {
      cost: 20,
      concessions: true
    }
  },
  '8D': {
    total: {
      cost: 12,
      concessions: false
    }
  },
  '1D': {
    total: {
      cost: 6,
      concessions: false
    }
  }
}

describe('The pricing summary calculator', () => {
  describe('for a junior licence', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.no
      })
    })

    it('returns the correct type pricing data', async () => {
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(juniorPricingByType))
    })

    it('returns the correct type pricing data with a disabled concession', async () => {
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(juniorPricingByType))
    })

    it('returns the correct length pricing data for a 12 month', async () => {
      const { result } = await injectWithCookies('GET', GET_PRICING_LENGTHS.uri)
      expect(result.byLength).toEqual(expect.objectContaining(juniorPricingByLength))
    })
  })

  describe('for an adult licence', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.no
      })
    })

    it('returns the correct type pricing data', async () => {
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(adultPricingByType))
    })

    it('returns the correct type pricing data with a disabled concession', async () => {
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(adultDisabledPricingByType))
    })

    it('returns the correct length pricing data', async () => {
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const { result } = await injectWithCookies('GET', GET_PRICING_LENGTHS.uri)
      expect(result.byLength).toEqual(expect.objectContaining(adultPricingByLength))
    })

    it('returns the correct length pricing data for a disabled concession', async () => {
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      const { result } = await injectWithCookies('GET', GET_PRICING_LENGTHS.uri)
      expect(result.byLength).toEqual(expect.objectContaining(adultDisabledPricingByLength))
    })
  })

  describe('for an senior licence', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(SENIOR_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.no
      })
    })

    it('returns the correct type pricing data', async () => {
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(seniorPricingByType))
    })

    it('returns the correct type pricing data with a disabled concession', async () => {
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      const { result } = await injectWithCookies('GET', GET_PRICING_TYPES.uri)
      expect(result.byType).toEqual(expect.objectContaining(seniorPricingByType))
    })

    it('returns the correct length pricing data', async () => {
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const { result } = await injectWithCookies('GET', GET_PRICING_LENGTHS.uri)
      expect(result.byLength).toEqual(expect.objectContaining(seniorPricingByLength))
    })

    it('returns the correct length pricing data for a disabled concession', async () => {
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const { result } = await injectWithCookies('GET', GET_PRICING_LENGTHS.uri)
      expect(result.byLength).toEqual(expect.objectContaining(seniorPricingByLength))
    })
  })
})
