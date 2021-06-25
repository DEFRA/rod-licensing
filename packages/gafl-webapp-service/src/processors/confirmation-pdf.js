/**
 * Create the pdfmake data structure for a permission
 * @param permission
 * @returns The permission structure for pdfmake
 */
import path from 'path'
import Dirname from '../../dirname.cjs'
import { displayStartTime, displayEndTime } from './date-and-time-display.js'
import * as mappings from './mapping-constants.js'
import { licenceTypeDisplay, licenceLengthDisplay } from './licence-type-display.js'
import { hasDisabled } from './concession-helper.js'
const eaImage = path.join(Dirname, 'public/images/EA-logo_black.png')

const style = {
  TABLE_HEADER: 'tableHeader',
  HEADER: 'header',
  SUBHEADER: 'subHeader',
  PARAGRAPH: 'para'
}

const alignment = {
  CENTRE: 'center',
  JUSTIFY: 'justify'
}

const tableRowHelper = (title, text) => [{ text: `${title}:`, style: style.TABLE_HEADER }, { text }]

const getTable = permission => {
  const tab = {
    body: [
      tableRowHelper('Name', `${permission.licensee.firstName} ${permission.licensee.lastName}`),
      tableRowHelper('Type', licenceTypeDisplay(permission)),
      tableRowHelper('Length', licenceLengthDisplay(permission))
    ]
  }

  tab.body.push(tableRowHelper('Disability concession', hasDisabled(permission) ? 'yes' : 'no'))
  tab.body.push(tableRowHelper('Start date', displayStartTime(permission)))
  tab.body.push(tableRowHelper('End date', displayEndTime(permission)))
  tab.body.push(tableRowHelper('Paid', permission.permit.cost === 0 ? 'free' : `£${permission.permit.cost}`))

  return tab
}

const getContent = permission => {
  const content = [
    {
      image: eaImage,
      alignment: alignment.CENTRE,
      width: 300
    },
    {
      text: 'Your rod fishing licence details',
      style: style.HEADER,
      alignment: alignment.CENTRE
    },
    {
      text: 'This is your licence number',
      alignment: alignment.CENTRE
    },
    {
      text: permission.referenceNumber,
      alignment: alignment.CENTRE,
      style: style.SUBHEADER,
      margin: [0, 20, 0, 60]
    },
    {
      table: getTable(permission),
      layout: 'noBorders'
    }
  ]

  content.push({ text: '\nOnly the named licence holder can use this licence.', style: 'para' })

  content.push({ text: 'Before you go fishing', style: 'subHeader' })
  content.push({
    text:
      'You can go fishing before you get your licence card, but you must be able to confirm your licence details if asked by an enforcement officer.',
    style: 'para'
  })

  content.push({
    text: [
      'You must follow the ',
      { text: 'rod fishing rules and local byelaws', link: 'https://www.gov.uk/freshwater-rod-fishing-rules', decoration: 'underline' }
    ],
    style: 'para'
  })

  if (permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout']) {
    content.push({ text: 'Report your yearly catch return', style: 'subHeader' })
    content.push({
      text: [
        'You must by law ',
        { text: 'report a catch return', link: 'https://www.gov.uk/catch-return', decoration: 'underline' },
        ' of your yearly salmon and sea trout fishing activity in England and Wales, even if you do not catch anything or do not fish.'
      ],
      style: style.PARAGRAPH
    })
  }

  return content
}

export const orderConfirmationPdf = permission => ({
  info: {
    title: 'Fishing licence: Order confirmation',
    author: 'DEFRA (Environment Agency)',
    subject: 'Fishing Licence Order Confirmation PDF'
  },
  content: getContent(permission),
  styles: {
    header: {
      fontSize: 22,
      margin: [0, 20, 0, 20],
      bold: true,
      alignment: alignment.JUSTIFY
    },
    subHeader: {
      fontSize: 18,
      margin: [0, 16, 0, 16],
      bold: true,
      alignment: alignment.JUSTIFY
    },
    tableHeader: {
      bold: true,
      fontSize: 13,
      color: 'black'
    },
    [style.PARAGRAPH]: {
      margin: [0, 0, 0, 16]
    }
  }
})
