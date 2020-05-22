import { Binding } from '../../../binding.js'
import * as premiseBindings from './premises.bindings.js'
import * as streetBindings from './street.bindings.js'
import * as localityBindings from './locality.bindings.js'
import * as townBindings from './town.bindings.js'
import * as postcodeBindings from './postcode.bindings.js'
import * as countryBindings from './country.bindings.js'

const premiseFields = [
  premiseBindings.POBox,
  premiseBindings.SubPrem,
  premiseBindings.Premises,
  premiseBindings.BuildName,
  premiseBindings.BuildNum
].map(e => e.element)
const streetFields = [streetBindings.Depthoro, streetBindings.Thoro, streetBindings.Address].map(e => e.element)
const localityFields = [localityBindings.Deplocal, localityBindings.Local, localityBindings.ContAddress].map(e => e.element)
const townFields = [townBindings.Town, townBindings.TownCity].map(e => e.element)
const postcodeFields = [postcodeBindings.Postcode, postcodeBindings.PostcodeZip].map(e => e.element)
const countryFields = [countryBindings.Country].map(e => e.element)

const extract = (fieldName, children, fields, sep = ' ') => {
  const value = fields
    .map(e => children[e])
    .filter(e => !!e)
    .join(sep)
  return value && { [fieldName]: value }
}

export const Address = new Binding({
  element: 'LICENSEE_ADDRESS',
  children: [
    ...Object.values(premiseBindings),
    ...Object.values(streetBindings),
    ...Object.values(localityBindings),
    ...Object.values(townBindings),
    ...Object.values(postcodeBindings),
    ...Object.values(countryBindings)
  ],
  transform: ({ children }) => ({
    ...extract('premises', children, premiseFields, ', '),
    ...extract('street', children, streetFields, ', '),
    ...extract('locality', children, localityFields, ', '),
    ...extract('town', children, townFields),
    ...extract('postcode', children, postcodeFields),
    ...extract('country', children, countryFields)
  })
})
