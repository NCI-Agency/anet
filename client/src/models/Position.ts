import Model, {
  createCustomFieldsSchema,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS,
  yupEmailAddresses
} from "components/Model"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export class PositionRole {
  // Static enumerations
  static MEMBER = new PositionRole("MEMBER", "member")
  static DEPUTY = new PositionRole("DEPUTY", "deputy")
  static LEADER = new PositionRole("LEADER", "leader")
  #value
  #humanReadable

  constructor(value, dictionaryKey) {
    this.#value = value
    this.#humanReadable = Settings.fields.position.role.types[dictionaryKey]
  }

  toString() {
    return this.#value
  }

  humanNameOfRole() {
    return this.#humanReadable
  }
}

export default class Position extends Model {
  static resourceName = "Position"
  static listName = "positionList"
  static getInstanceName = "position"
  static relatedObjectType = "positions"

  static TYPE = {
    REGULAR: "REGULAR",
    SUPERUSER: "SUPERUSER",
    ADMINISTRATOR: "ADMINISTRATOR"
  }

  static SUPERUSER_TYPE = {
    REGULAR: "REGULAR",
    CAN_CREATE_TOP_LEVEL_ORGANIZATIONS: "CAN_CREATE_TOP_LEVEL_ORGANIZATIONS",
    CAN_CREATE_OR_EDIT_ANY_ORGANIZATION: "CAN_CREATE_OR_EDIT_ANY_ORGANIZATION"
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
        .label(Settings.fields.position.name?.label),
      type: yup
        .string()
        .required()
        .default(() => Position.TYPE.REGULAR),
      superuserType: yup.string().nullable().default(null),
      code: yup.string().nullable().default(""),
      status: yup
        .string()
        .required()
        .default(() => Model.STATUS.ACTIVE),
      role: yup
        .string()
        .required()
        .default(() => PositionRole.MEMBER.toString()),
      description: yup.string().nullable().default(""),
      associatedPositions: yup.array().nullable().default([]),
      previousPeople: yup.array().nullable().default([]),
      organization: yup
        .object()
        .nullable()
        .default(null)
        .label(Settings.fields.position.organization?.label)
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
        .label(Settings.fields.position.location?.label),
      emailAddresses: yupEmailAddresses
    })

    // not actually in the database, the database contains the JSON customFields
    .concat(Position.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid name code type role status location { uuid name }" +
    ` organization { uuid shortName longName identificationCode ${GRAPHQL_ENTITY_AVATAR_FIELDS} }` +
    ` person { uuid name rank ${GRAPHQL_ENTITY_AVATAR_FIELDS} }`

  static allFieldsQuery = `
    uuid
    name
    type
    superuserType
    role
    status
    isSubscribed
    updatedAt
    code
    description
    emailAddresses {
      network
      address
    }
    organization {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    person {
      uuid
      name
      rank
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    associatedPositions {
      uuid
      name
      type
      role
      person {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      organization {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
    }
    previousPeople {
      startTime
      endTime
      person {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    location {
      uuid
      name
      lat
      lng
      type
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    customFields
    ${GRAPHQL_NOTES_FIELDS}
  `

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static humanNameOfType(type) {
    if (type === Position.TYPE.REGULAR) {
      return Settings.fields.regular.position.type
    } else if (type === Position.TYPE.SUPERUSER) {
      return Settings.fields.superuser.position.type
    } else if (type === Position.TYPE.ADMINISTRATOR) {
      return Settings.fields.administrator.position.type
    }
  }

  static humanNameOfSuperuserType(superuserType) {
    if (superuserType === Position.SUPERUSER_TYPE.REGULAR) {
      return "Regular"
    } else if (
      superuserType ===
      Position.SUPERUSER_TYPE.CAN_CREATE_TOP_LEVEL_ORGANIZATIONS
    ) {
      return "Can Create top-level Organizations"
    } else if (
      superuserType ===
      Position.SUPERUSER_TYPE.CAN_CREATE_OR_EDIT_ANY_ORGANIZATION
    ) {
      return "Can Create or Edit any Organization"
    }
  }

  static humanNameOfRole(role) {
    return PositionRole[role]?.humanNameOfRole()
  }

  constructor(props) {
    super(Model.fillObject(props, Position.yupSchema))
  }

  humanNameOfType() {
    return Position.humanNameOfType(this.type)
  }

  humanNameOfRole() {
    return Position.humanNameOfRole(this.role)
  }

  isRegular() {
    return this.type === Position.TYPE.REGULAR
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
      case "REGULAR":
        return Settings.fields.regular.position.type
      case "SUPERUSER":
        return Settings.fields.superuser.position.type
      case "ADMINISTRATOR":
        return Settings.fields.administrator.position.type
      default:
        return "Default Case"
    }
  }

  static isRegular(position) {
    return position.type === Position.TYPE.REGULAR
  }

  iconUrl() {
    return POSITIONS_ICON
  }

  static FILTERED_CLIENT_SIDE_FIELDS = ["authorizationGroups"]

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
