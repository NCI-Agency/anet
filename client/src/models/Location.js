import Model from "components/Model"
import LOCATIONS_ICON from "resources/locations.png"
import utils from "utils"
import * as yup from "yup"

export default class Location extends Model {
  static resourceName = "Location"
  static listName = "locationList"
  static getInstanceName = "location"
  static getModelNameLinkTo = "anetLocation"

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
      status: yup
        .string()
        .required()
        .default(() => Location.STATUS.ACTIVE),
      lat: yup
        .number()
        .nullable()
        .default(null),
      lng: yup
        .number()
        .nullable()
        .default(null)
    })
    .concat(Model.yupSchema)

  static autocompleteQuery = "uuid, name"

  static hasCoordinates(location) {
    return (
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    )
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Location.yupSchema))
  }

  iconUrl() {
    return LOCATIONS_ICON
  }

  toString() {
    return this.name
  }
}
