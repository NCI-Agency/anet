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

  static APPROVAL_STEP_TYPE = {
    PLANNING_APPROVAL: "PLANNING_APPROVAL",
    REPORT_APPROVAL: "REPORT_APPROVAL"
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
        .default(null),
      // FIXME: resolve code duplication in yup schema for approval steps
      planningApprovalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Location.APPROVAL_STEP_TYPE.PLANNING_APPROVAL),
            approvers: yup
              .array()
              .required("You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([]),
      approvalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Location.APPROVAL_STEP_TYPE.REPORT_APPROVAL),
            approvers: yup
              .array()
              .required("You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([])
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
