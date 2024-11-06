import Model from "components/Model"

export default class Comment extends Model {
  static resourceName = "Comment"

  static schema = {
    reportUuid: null,
    author: {},
    text: ""
  }

  toString() {
    return this.text
  }
}
