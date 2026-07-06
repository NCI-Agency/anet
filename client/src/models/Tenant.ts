import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import Model from "components/Model"
import utils from "utils"
import * as yup from "yup"

export default class Tenant extends Model {
  static resourceName = "Tenant"

  static yupSchema = yup.object().shape({
    name: yup.string().required().default(""),
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    emailAddresses: yup
      .array()
      .of(yup.string().email("Address must be a valid email").nullable())
      .nullable()
      .default([]),
    administrativePositions: yup.array().nullable().default([]),
    members: yup.array().nullable().default([])
  })

  static autocompleteQuery = gqlEntityFieldsMap.Tenant

  constructor(props) {
    super(Model.fillObject(props, Tenant.yupSchema))
  }

  static pathFor(instance, query) {
    const uuid = instance.uuid
    let url = ["", "tenants", uuid].join("/")
    url += utils.formatQueryString(query)
    return url
  }

  static pathForNew(query) {
    let url = ["", "admin", "tenants", "new"].join("/")
    url += utils.formatQueryString(query)
    return url
  }

  toString() {
    return this.name || "Unnamed"
  }
}
