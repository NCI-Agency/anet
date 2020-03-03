import { Settings } from "api"
import Model from "components/Model"
import AFG_ICON from "resources/afg_small.png"
import POSITIONS_ICON from "resources/positions.png"
import RS_ICON from "resources/rs_small.png"
import utils from "utils"
import * as yup from "yup"

export const advisorPosition = Settings.fields.advisor.position
export const principalPosition = Settings.fields.principal.position
export const administratorPosition = Settings.fields.administrator.position
export const superUserPosition = Settings.fields.superUser.position

export default class Position extends Model {
  static resourceName = "Position"
  static listName = "positionList"
  static getInstanceName = "position"

  static STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  }

  static TYPE = {
    ADVISOR: "ADVISOR",
    PRINCIPAL: "PRINCIPAL",
    SUPER_USER: "SUPER_USER",
    ADMINISTRATOR: "ADMINISTRATOR"
  }

  static yupSchema = yup
    .object()
    .shape({
      name: yup
        .string()
        .required()
        .default("")
        .label(Settings.fields.position.name),
      type: yup
        .string()
        .required()
        .default(() => Position.TYPE.ADVISOR),
      code: yup
        .string()
        .nullable()
        .default(""),
      status: yup
        .string()
        .required()
        .default(() => Position.STATUS.ACTIVE),
      associatedPositions: yup
        .array()
        .nullable()
        .default([]),
      previousPeople: yup
        .array()
        .nullable()
        .default([]),
      organization: yup
        .object()
        .nullable()
        .default({})
        .test(
          "required-object",
          // eslint-disable-next-line no-template-curly-in-string
          "${path} is required",
          value => value && value.uuid
        ),
      person: yup
        .object()
        .nullable()
        .default({}),
      location: yup
        .object()
        .nullable()
        .default({})
    })
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid, name, code, type, status, organization { uuid, shortName}, person { uuid, name, rank, role, avatar(size: 32) }"

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static humanNameOfType(type) {
    if (type === Position.TYPE.PRINCIPAL) {
      return principalPosition.type
    } else if (type === Position.TYPE.ADVISOR) {
      return advisorPosition.type
    } else if (type === Position.TYPE.SUPER_USER) {
      return superUserPosition.type
    } else if (type === Position.TYPE.ADMINISTRATOR) {
      return administratorPosition.type
    }
  }

  constructor(props) {
    super(Model.fillObject(props, Position.yupSchema))
  }

  humanNameOfType() {
    return Position.humanNameOfType(this.type)
  }

  isAdvisor() {
    return this.type === Position.TYPE.ADVISOR
  }

  isPrincipal() {
    return this.type === Position.TYPE.PRINCIPAL
  }

  toString() {
    return this.name
  }

  iconUrl() {
    if (this.isAdvisor()) {
      return RS_ICON
    } else if (this.isPrincipal()) {
      return AFG_ICON
    } else {
      return POSITIONS_ICON
    }
  }
}
