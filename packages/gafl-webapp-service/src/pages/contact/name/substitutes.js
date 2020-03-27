const regexApostrophe = /\u2019/g
const regexHyphen = /\u2014/g
const regexMultiSpace = /\u0020{2,}/g

export default txt =>
  txt
    .replace(regexApostrophe, '\u0027')
    .replace(regexHyphen, '\u2010')
    .replace(regexMultiSpace, '\u0020')
