import Model from "components/Model"
import encodeQuery from "querystring/encode"
import utils from "utils"
import * as yup from "yup"

export default class AuthorizationGroup extends Model {
  static resourceName = "AuthorizationGroup"
  static listName = "authorizationGroupList"
  static getInstanceName = "authorizationGroup"

  static displayName() {
    // TODO: Get the display name from the dictionary
    return "Authorization Group"
  }

  static STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  }

  static yupSchema = yup
    .object()
    .shape({
      name: yup
        .string()
        .required()
        .default(""),
      description: yup
        .string()
        .required()
        .default(""),
      status: yup
        .string()
        .required()
        .default(() => AuthorizationGroup.STATUS.ACTIVE),
      positions: yup
        .array()
        .nullable()
        .default([])
    })
    .concat(Model.yupSchema)

  static autocompleteQuery = "uuid, name, description"

  static pathFor(instance, query) {
    if (!instance) {
      return console.error(
        `You didn't pass anything to ${this.name}.pathFor. If you want a new route, you can pass null.`
      )
    }

    if (process.env.NODE_ENV !== "production") {
      if (!this.resourceName) {
        return console.error(
          `You must specify a resourceName on model ${this.name}.`
        )
      }
    }

    const resourceName = utils.resourceize(this.resourceName)
    const uuid = instance.uuid
    let url = ["", "admin", resourceName, uuid].join("/")

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

  static pathForNew(query) {
    const resourceName = utils.resourceize(this.resourceName)
    let url = ["", "admin", resourceName, "new"].join("/")

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

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
