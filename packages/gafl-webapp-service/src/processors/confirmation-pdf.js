/**
 * Create the PDF data stream
 * @param request
 * @returns {{styles: {para: {margin: number[]}, header: {margin: number[], fontSize: number, bold: boolean, alignment: string}, subHeader: {margin: number[], fontSize: number, bold: boolean, alignment: string}, tableHeader: {color: string, fontSize: number, bold: boolean}}, content: [{text: string, alignment: string}], info: {author: string, subject: string, title: string}}}
 */

export const orderConfirmationPdf = request => ({
  info: {
    title: 'Fishing licence: Order confirmation',
    author: 'DEFRA (Environment Agency)',
    subject: 'Fishing Licence Order Confirmation PDF'
  },
  content: [{
    text: 'Your fishing licence number is:',
    alignment: 'center'
  }],
  styles: {
    header: {
      fontSize: 22,
      margin: [0, 20, 0, 20],
      bold: true,
      alignment: 'justify'
    },
    subHeader: {
      fontSize: 18,
      margin: [0, 16, 0, 16],
      bold: true,
      alignment: 'justify'
    },
    tableHeader: {
      bold: true,
      fontSize: 13,
      color: 'black'
    },
    para: {
      margin: [0, 0, 0, 16]
    }
  }
})