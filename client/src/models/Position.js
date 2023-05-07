import Model, {
  createCustomFieldsSchema,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import AFG_ICON from "resources/afg_small.png"
import POSITIONS_ICON from "resources/positions.png"
import RS_ICON from "resources/rs_small.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export const advisorPosition = Settings.fields.advisor.position
export const principalPosition = Settings.fields.principal.position
export const administratorPosition = Settings.fields.administrator.position
export const superuserPosition = Settings.fields.superuser.position

export const memberPositionRole = Settings.fields.member.position
export const deputyPositionRole = Settings.fields.deputy.position
export const leaderPositionRole = Settings.fields.leader.position

export default class Position extends Model {
  static resourceName = "Position"
  static listName = "positionList"
  static getInstanceName = "position"
  static relatedObjectType = "positions"

  static TYPE = {
    ADVISOR: "ADVISOR",
    PRINCIPAL: "PRINCIPAL",
    SUPERUSER: "SUPERUSER",
    ADMINISTRATOR: "ADMINISTRATOR"
  }

  static POSITION_ROLE = {
    MEMBER: "MEMBER",
    DEPUTY: "DEPUTY",
    LEADER: "LEADER"
  }

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(
    Settings.fields.position.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      name: yup
        .string()
        .required("Position name is required")
        .default("")
        .label(Settings.fields.position.name),
      type: yup
        .string()
        .required()
        .default(() => Position.TYPE.ADVISOR),
      code: yup.string().nullable().default(""),
      status: yup
        .string()
        .required()
        .default(() => Model.STATUS.ACTIVE),
      positionRole: yup
        .string()
        .required()
        .default(() => Position.POSITION_ROLE.MEMBER),
      associatedPositions: yup.array().nullable().default([]),
      previousPeople: yup.array().nullable().default([]),
      organization: yup
        .object()
        .nullable()
        .default(null)
        .label("Organization")
        .test(
          "required-object",
          // eslint-disable-next-line no-template-curly-in-string
          "${path} is required",
          org => org && org.uuid
        ),
      person: yup.object().nullable().default({}),
      location: yup
        .object()
        .nullable()
        .default(null)
        .label("Location")
        .when("type", ([type], schema) =>
          [
            Position.TYPE.ADVISOR,
            Position.TYPE.SUPERUSER,
            Position.TYPE.ADMINISTRATOR
          ].includes(type)
            ? schema.required(
              `Location is required for ${advisorPosition.name}`
            )
            : schema.nullable()
        )
    })

    // not actually in the database, the database contains the JSON customFields
    .concat(Position.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid name code type positionRole status location { uuid name } organization { uuid shortName} person { uuid name rank role avatar(size: 32) }"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static allFieldsQuery = `
    uuid
    name
    type
    positionRole
    status
    isSubscribed
    updatedAt
    code
    organization {
      uuid
      shortName
      longName
      identificationCode
    }
    person {
      uuid
      name
      rank
      role
      avatar(size: 32)
    }
    associatedPositions {
      uuid
      name
      type
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
      organization {
        uuid
        shortName
      }
    }
    previousPeople {
      startTime
      endTime
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
        previousPositions {
          startTime
          endTime
          position {
            uuid
          }
        }
      }
    }
    organizationsAdministrated {
      uuid
      shortName
      longName
      identificationCode
    }
    location {
      uuid
      name
      lat
      lng
      type
    }
    customFields
    ${GRAPHQL_NOTES_FIELDS}
  `

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static humanNameOfType(type) {
    if (type === Position.TYPE.PRINCIPAL) {
      return principalPosition.type
    } else if (type === Position.TYPE.ADVISOR) {
      return advisorPosition.type
    } else if (type === Position.TYPE.SUPERUSER) {
      return superuserPosition.type
    } else if (type === Position.TYPE.ADMINISTRATOR) {
      return administratorPosition.type
    }
  }

  static humanNameOfPositionRole(positionRole) {
    if (positionRole === Position.POSITION_ROLE.MEMBER) {
      return memberPositionRole.type
    } else if (positionRole === Position.POSITION_ROLE.DEPUTY) {
      return deputyPositionRole.type
    } else if (positionRole === Position.POSITION_ROLE.LEADER) {
      return leaderPositionRole.type
    }
  }

  constructor(props) {
    super(Model.fillObject(props, Position.yupSchema))
  }

  humanNameOfType() {
    return Position.humanNameOfType(this.type)
  }

  humanNameOfPositionRole() {
    return Position.humanNameOfPositionRole(this.positionRole)
  }

  isAdvisor() {
    return this.type === Position.TYPE.ADVISOR
  }

  isPrincipal() {
    return this.type === Position.TYPE.PRINCIPAL
  }

  isActive() {
    return Position.isActive(this)
  }

  static isActive(pos) {
    return pos.status === Position.STATUS.ACTIVE
  }

  toString() {
    return this.name
  }

  static convertType(type) {
    switch (type) {
      case "ADVISOR":
        return Settings.fields.advisor.position.type
      case "PRINCIPAL":
        return Settings.fields.principal.position.type
      case "SUPERUSER":
        return Settings.fields.superuser.position.type
      case "ADMINISTRATOR":
        return Settings.fields.administrator.position.type
      default:
        return "Default Case"
    }
  }

  static convertPositionRole(positionRole) {
    switch (positionRole) {
      case "MEMBER":
        return Settings.fields.member.position.type
      case "DEPUTY":
        return Settings.fields.deputy.position.type
      case "LEADER":
        return Settings.fields.leader.position.type
      default:
        return "Default Case"
    }
  }

  static isAdvisor(position) {
    return position.type === Position.TYPE.ADVISOR
  }

  static isPrincipal(position) {
    return position.type === Position.TYPE.PRINCIPAL
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

  static FILTERED_CLIENT_SIDE_FIELDS = [
    // Fill if necessary
  ]

  static filterClientSideFields(obj, ...additionalFields) {
    // Filter formCustomFields in associatedPositions
    if (obj.associatedPositions) {
      obj.associatedPositions = obj.associatedPositions.map(ap =>
        Position.filterClientSideFields(ap)
      )
    }
    return Model.filterClientSideFields(
      obj,
      ...Position.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Position.filterClientSideFields(this, ...additionalFields)
  }
}
