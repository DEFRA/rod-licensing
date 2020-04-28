import moment from 'moment'

export class Binding {
  static TransformTextOnly = context => context && context.value
  static TransformNumeric = context => Binding.TransformTextOnly(context) && Number(context.value)
  static TransformUKDate = context => moment(Binding.TransformTextOnly(context), 'DD/MM/YYYY', true).format('YYYY-MM-DD')
  static TransformYesNo = (valueIfYes, valueIfNo) => context => (Binding.TransformTextOnly(context) === 'Y' ? valueIfYes : valueIfNo)

  constructor ({ element, children, transform }) {
    this._element = element
    this._transform = transform
    this._children = children || []
  }

  /**
   * @returns {!Binding}
   */
  get element () {
    return this._element
  }

  /**
   *
   * @returns {Array<Binding>}
   */
  get children () {
    return this._children
  }

  async transform (context) {
    for (const child of this.children) {
      const transformed = await child.transform(context.children[child.element])
      context.children[child.element] = transformed
    }
    return this._transform(context)
  }
}
