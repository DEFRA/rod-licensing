import querystring from 'querystring'
import { ADDRESS_LOOKUP_SERVICE } from '../constants.js'

export default async (premises, postcode) => {
  const queryStr = querystring.stringify({
    premises: premises,
    postcode: postcode,
    key: ADDRESS_LOOKUP_SERVICE.key,
    lang: ADDRESS_LOOKUP_SERVICE.lang,
    dataset: ADDRESS_LOOKUP_SERVICE.dataset
  })

  console.log(queryStr)
  return []
}
