import {
  gqlAllAttachmentFields,
  gqlAllEventSeriesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlHostMembers
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import Model from "components/Model"
import EVENT_SERIES_ICON from "resources/eventSeries.png"
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
    adminOrg: yup.object().nullable().default(null),
    hostRelatedObjects: yup.array().nullable().default([])
  })

  static autocompleteQuery = `
    ${gqlEntityFieldsMap.EventSeries}
    ownerOrg {
      ${gqlEntityFieldsMap.Organization}
    }
    adminOrg {
      ${gqlEntityFieldsMap.Organization}
    }
    ${gqlHostMembers}
  `

  static getEventSeriesQuery = gql`
    query ($uuid: String) {
      eventSeries(uuid: $uuid) {
        ${gqlAllEventSeriesFields}
        ${gqlEntityAvatarFields}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        attachments {
          ${gqlAllAttachmentFields}
        }
        ${gqlHostMembers}
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
}
