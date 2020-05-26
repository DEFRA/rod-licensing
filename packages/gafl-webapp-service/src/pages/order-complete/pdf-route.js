import path from 'path'
import Dirname from '../../../dirname.cjs'
import { ORDER_COMPLETE_PDF } from '../../uri.js'
import { PDF_FILENAME } from '../../constants.js'
import { orderConfirmationPdf } from '../../processors/confirmation-pdf.js'
import Pdfmake from 'pdfmake'

const createPdfBinary = async pdfDoc => {
  return new Promise(resolve => {
    const printer = new Pdfmake({
      Roboto: {
        normal: path.join(Dirname, 'src/pages/fonts/Roboto-Regular.ttf'),
        bold: path.join(Dirname, 'src/pages/fonts/Roboto-Medium.ttf'),
        italics: path.join(Dirname, 'src/pages/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(Dirname, 'src/pages/fonts/Roboto-MediumItalic.ttf')
      }
    })
    const doc = printer.createPdfKitDocument(pdfDoc)
    const chunks = []

    doc.on('data', function (chunk) {
      chunks.push(chunk)
    })
    doc.on('end', function () {
      resolve(Buffer.concat(chunks))
    })
    doc.end()
  })
}

export default {
  method: 'GET',
  path: ORDER_COMPLETE_PDF.uri,
  handler: async (request, h) => {
    const permission = await request.cache().helpers.transaction.getCurrentPermission()
    const data = await createPdfBinary(orderConfirmationPdf(permission))
    return h
      .response(data)
      .header(`Content-Disposition', 'attachment; filename=${PDF_FILENAME}`)
      .type('data:application/pdf')
  }
}
