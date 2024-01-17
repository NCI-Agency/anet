import Model from "components/Model"
import utils from "utils"
import * as yup from "yup"

export default class AuthorizationGroup extends Model {
  static resourceName = "AuthorizationGroup"
  static listName = "authorizationGroupList"
  static getInstanceName = "authorizationGroup"
  static relatedObjectType = "authorizationGroups"

  static displayName() {
    // TODO: Get the display name from the dictionary
    return "Authorization Group"
  }

  static schema = {}

  static yupSchema = yup.object().shape({
    name: yup.string().required().default(""),
    description: yup.string().required().default(""),
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    administrativePositions: yup.array().nullable().default([]),
    authorizationGroupRelatedObjects: yup.array().nullable().default([])
  })

  static autocompleteQuery = "uuid name description"

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, AuthorizationGroup.yupSchema))
  }

  humanNameOfStatus() {
    return AuthorizationGroup.humanNameOfStatus(this.status)
  }

  toString() {
    return this.name || this.description || "Unnamed"
  }
}
