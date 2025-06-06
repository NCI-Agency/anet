import { gql } from "@apollo/client"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import EVENT_SERIES_ICON from "resources/eventSeries.png"
import utils from "utils"
import * as yup from "yup"

export default class EventSeries extends Model {
  static resourceName = "EventSeries"
  static listName = "eventSeriesList"
  static getInstanceName = "eventSeries"
  static relatedObjectType = "eventSeries"

  static displayName() {
    return "Event Series"
  }

  static schema = {}

  static yupSchema = yup.object().shape({
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    name: yup.string().required().default(""),
    description: yup.string().default(""),
    ownerOrg: yup.object().nullable().default(null),
    hostOrg: yup.object().nullable().default(null),
    adminOrg: yup.object().nullable().default(null)
  })

  static autocompleteQuery = `
    uuid
    name
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    ownerOrg {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    hostOrg {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
    adminOrg {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
  `

  static getEventSeriesQuery = gql`
    query ($uuid: String) {
      eventSeries(uuid: $uuid) {
        uuid
        status
        name
        description
        isSubscribed
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ownerOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        hostOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        adminOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        attachments {
            uuid
            fileName
            caption
            description
            classification
            mimeType
            contentLength
            createdAt
        }
      }
    }
  `

  constructor(props) {
    super(Model.fillObject(props, EventSeries.yupSchema))
  }

  iconUrl() {
    return EVENT_SERIES_ICON
  }

  toString() {
    return this.name
  }

  static FILTERED_CLIENT_SIDE_FIELDS = []

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...EventSeries.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return EventSeries.filterClientSideFields(this, ...additionalFields)
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }
}
