import { salesApi } from '@defra-fish/connectors-lib'

const optionProc = c => Object.values(c.options)
  .map(p => ({
    code: p.description,
    name: p.label
  }))

const local = {}

// Process the country code option set into a useful form - once
export const countries = {
  getAll: async () => {
    local.countries = local.countries || optionProc(await salesApi.countries.getAll()).sort(a => (a.code === 'GB' ? -1 : 0))
    return local.countries
  },
  nameFromCode: async code => {
    local.countries = local.countries || optionProc(await salesApi.countries.getAll()).sort(a => (a.code === 'GB' ? -1 : 0))
    return local.countries.find(c => c.code === code).name
  }
}
