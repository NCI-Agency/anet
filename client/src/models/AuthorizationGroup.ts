import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import Model from "components/Model"
import COMMUNITIES_ICON from "resources/communities.png"
import utils from "utils"
import * as yup from "yup"

export default class AuthorizationGroup extends Model {
  static resourceName = "AuthorizationGroup"
  static listName = "authorizationGroupList"
  static getInstanceName = "authorizationGroup"
  static relatedObjectType = "authorizationGroups"

  static displayName() {
    // TODO: Get the display name from the dictionary
    return "Community"
  }

  static schema = {}

  static yupSchema = yup.object().shape({
    name: yup.string().required().default(""),
    description: yup.string().nullable().default(""),
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    distributionList: yup.boolean().required().default(false),
    forSensitiveInformation: yup.boolean().required().default(false),
    administrativePositions: yup.array().nullable().default([]),
    authorizationGroupRelatedObjects: yup.array().nullable().default([])
  })

  static autocompleteQuery = gqlEntityFieldsMap.AuthorizationGroup

  constructor(props) {
    super(Model.fillObject(props, AuthorizationGroup.yupSchema))
  }

  static pathFor(instance, query) {
    const uuid = instance.uuid
    let url = ["", "communities", uuid].join("/")
    url += utils.formatQueryString(query)
    return url
  }

  static pathForNew(query) {
    let url = ["", "communities", "new"].join("/")
    url += utils.formatQueryString(query)
    return url
  }

  iconUrl() {
    return COMMUNITIES_ICON
  }

  toString() {
    return this.name || this.description || "Unnamed"
  }
}
