import { ADDRESS_ENTRY } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { countries } from '../../../../processors/refdata-helper.js'
import { nextPage } from '../../../../routes/next-page.js'

export const validator = Joi.object({
  premises: validation.contact.createPremisesValidator(Joi),
  street: validation.contact.createStreetValidator(Joi),
  locality: validation.contact.createLocalityValidator(Joi),
  town: validation.contact.createTownValidator(Joi),
  postcode: Joi.alternatives().conditional('country-code', {
    is: Joi.string().pattern(/^GB/),
    then: validation.contact.createUKPostcodeValidator(Joi),
    otherwise: validation.contact.createOverseasPostcodeValidator(Joi)
  }),
  'country-code': Joi.string().required()
}).options({ abortEarly: false, allowUnknown: true })

export const getCountryDropDownOptions = async () => {
  const options = await countries.getAll()
  return options.filter(country => country.code !== 'GB')
}

export const getData = async request => {
  const { addresses, searchTerms } = await request.cache().helpers.addressLookup.getCurrentPermission()
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    isLicenceForYou,
    searchTerms: !addresses?.length && searchTerms ? searchTerms : null,
    countries: await getCountryDropDownOptions()
  }
}

export default pageRoute(ADDRESS_ENTRY.page, ADDRESS_ENTRY.uri, validator, nextPage, getData)
