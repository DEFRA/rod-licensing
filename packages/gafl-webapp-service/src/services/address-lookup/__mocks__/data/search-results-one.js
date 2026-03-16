export default {
  header: {
    uri: 'https://api.os.uk/search/places/v1/postcode?postcode=BS9%201HJ',
    query: 'postcode=BS9 1HJ',
    offset: 0,
    totalresults: 1,
    format: 'JSON',
    dataset: 'DPA',
    lr: 'EN,CY',
    maxresults: 100,
    epoch: '125',
    lastupdate: '2026-02-26',
    output_srs: 'EPSG:27700'
  },
  results: [
    {
      DPA: {
        UPRN: '47184',
        UDPRN: '123456',
        ADDRESS: '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL, BS9 1HJ',
        BUILDING_NAME: '1 HOWECROFT COURT',
        THOROUGHFARE_NAME: 'EASTMEAD LANE',
        POST_TOWN: 'BRISTOL',
        POSTCODE: 'BS9 1HJ',
        RPC: '2',
        X_COORDINATE: 356315.0,
        Y_COORDINATE: 175793.0,
        STATUS: 'APPROVED',
        LOGICAL_STATUS_CODE: '1',
        CLASSIFICATION_CODE: 'RD06',
        CLASSIFICATION_CODE_DESCRIPTION: 'Self Contained Flat (Includes Maisonette / Apartment)',
        LOCAL_CUSTODIAN_CODE: 1234,
        LOCAL_CUSTODIAN_CODE_DESCRIPTION: 'BRISTOL CITY COUNCIL',
        COUNTRY_CODE: 'E',
        COUNTRY_CODE_DESCRIPTION: 'This record is within England',
        POSTAL_ADDRESS_CODE: 'D',
        POSTAL_ADDRESS_CODE_DESCRIPTION: 'A record which is linked to PAF',
        BLPU_STATE_CODE: '2',
        BLPU_STATE_CODE_DESCRIPTION: 'In use',
        TOPOGRAPHY_LAYER_TOID: 'osgb1000014879590',
        PARENT_UPRN: '46250',
        LAST_UPDATE_DATE: '06/12/2018',
        ENTRY_DATE: '16/01/1997',
        BLPU_STATE_DATE: '16/01/1997',
        LANGUAGE: 'EN',
        MATCH: 1.0,
        MATCH_DESCRIPTION: 'EXACT'
      }
    }
  ]
}
