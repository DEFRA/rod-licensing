/**
 * Create the pdfmake data structure for a permission
 * @param permission
 * @returns The permission structure for pdfmake
 */
import path from 'path'
import Dirname from '../../dirname.cjs'
import { displayStartTime, displayEndTime } from './date-and-time-display.js'
import * as mappings from './mapping-constants.js'
import * as concessionHelper from './concession-helper.js'

const crownImage = path.join(Dirname, 'public/images/govuk-crest.png')

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

const licenceLength = permission => {
  switch (permission.licenceLength) {
    case '1D':
      return '1 Day'
    case '8D':
      return '8 Days'
    default:
      return '12 Months'
  }
}

const tableRowHelper = (title, text) => [{ text: `${title}:`, style: style.TABLE_HEADER }, { text }]

const getTable = permission => {
  const tab = {
    body: [
      tableRowHelper('Name', `${permission.licensee.firstName} ${permission.licensee.lastName}`),
      tableRowHelper('Type', permission.licenceType),
      tableRowHelper('Length', licenceLength(permission))
    ]
  }

  if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    tab.body.push(tableRowHelper('Number of rods', permission.numberOfRods))
  }

  if (concessionHelper.hasDisabled(permission) && concessionHelper.hasJunior(permission)) {
    tab.body.push(tableRowHelper('Concessions', 'Junior, Disabled'))
  } else if (concessionHelper.hasDisabled(permission) && concessionHelper.hasSenior(permission)) {
    tab.body.push(tableRowHelper('Concessions', 'Senior, Disabled'))
  } else if (concessionHelper.hasDisabled(permission)) {
    tab.body.push(tableRowHelper('Concessions', 'Disabled'))
  } else if (concessionHelper.hasJunior(permission)) {
    tab.body.push(tableRowHelper('Concessions', 'Junior'))
  } else if (concessionHelper.hasSenior(permission)) {
    tab.body.push(tableRowHelper('Concessions', 'Senior'))
  }

  tab.body.push(tableRowHelper('Valid from', displayStartTime(permission)))
  tab.body.push(tableRowHelper('Expires', displayEndTime(permission)))

  return tab
}

const getContent = permission => {
  const content = [
    {
      image: crownImage,
      alignment: alignment.CENTRE
    },
    {
      text: 'GOV.UK',
      style: 'subHeader',
      margin: [4, 6, 0, 0],
      alignment: alignment.CENTRE
    },
    {
      text: "You've bought your licence",
      style: style.HEADER,
      alignment: alignment.CENTRE
    },
    {
      text: 'Your fishing licence number is:',
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

  if (permission.licenceLength === '12M') {
    if (concessionHelper.hasJunior(permission)) {
      content.push({ text: "We don't send junior licences in the post", style: 'subHeader' })
      content.push({
        text:
          'If our bailiffs ask to see your licence, you must show them proof of your licence. Print out this page or make a note of your licence number.',
        style: 'para'
      })
    } else {
      content.push({ text: 'Want to go fishing before your licence arrives?', style: 'subHeader' })
      content.push({
        text: 'Your licence will arrive in the post within 10 working days. To go fishing before you receive it, you must take:',
        style: 'para'
      })
    }
  } else {
    content.push({ text: 'We don’t send 1-day or 8-day licences in the post', style: 'subHeader' })
    content.push({ text: 'If our bailiffs ask to see your licence, you must show them:', style: 'para' })
  }

  if (!concessionHelper.hasJunior(permission)) {
    content.push({
      ol: [
        { text: [{ text: 'proof of your licence: ', bold: true }, ' print out this page or make a note of your licence number'] },
        { text: [{ text: 'proof of your identity, ', bold: true }, " such as your driver's licence or other photo ID"] }
      ]
    })
  }

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
