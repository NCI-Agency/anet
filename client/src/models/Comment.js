import Model from "components/Model"

export default class Comment extends Model {
  static resourceName = "Comment"

  static schema = {
    reportUuid: null,
    author: {},
    text: "",
    ...Model.schema
  }

  toString() {
    return this.text
  }
}
