import { gql } from "@apollo/client"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import Settings from "settings"
import * as yup from "yup"

export default class EventSeries extends Model {
  static resourceName = "EventSeries"
  static listName = "eventSeriesList"
  static getInstanceName = "Event Series"
  static relatedObjectType = "Event Series"

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
    description: yup.string().required().default(""),
    hostOrg: yup
      .object()
      .test("hostOrg", "host org error", (hostOrg, testContext) =>
        _isEmpty(hostOrg)
          ? testContext.createError({
            message: `You must provide the ${Settings.fields.eventSeries.hostOrg.label}`
          })
          : true
      )
      .default({}),
    adminOrg: yup
      .object()
      .test("adminOrg", "admin org error", (adminOrg, testContext) =>
        _isEmpty(adminOrg)
          ? testContext.createError({
            message: `You must provide the ${Settings.fields.eventSeries.adminOrg.label}`
          })
          : true
      )
      .default({})
  })

  static autocompleteQuery = `
    uuid
    status
    name
    description
    hostOrg {
      uuid
      shortName
    }
    adminOrg {
      uuid
      shortName
    }
   `

  static getEventSeriesQueryMin = gql`
    query ($uuid: String) {
      eventSeries(uuid: $uuid) {
        uuid
        name
        hostOrg {
          uuid
          shortName
          longName
        }
        adminOrg {
          uuid
          shortName
          longName
        }
      }
    }
  `

  static getEventSeriesQuery = gql`
    query ($uuid: String) {
      eventSeries(uuid: $uuid) {
        uuid
        name
        description
        updatedAt
        isSubscribed
        hostOrg {
          uuid
          shortName
          longName
        }
        adminOrg {
          uuid
          shortName
          longName
        }
      }
    }
  `

  static getEventSeriesListQuery = gql`
    query ($eventSeriesQuery: EventSeriesSearchQueryInput) {
      eventSeriesList(query: $eventSeriesQuery) {
        pageNum
        pageSize
        totalCount
        list {
          uuid
          name
          description
          isSubscribed
          hostOrg {
            uuid
            shortName
            longName
            identificationCode
          }
          adminOrg {
            uuid
            shortName
            longName
            identificationCode
          }
          updatedAt
        }
      }
    }
  `

  static getCreateEventSeriesMutation = gql`
    mutation ($eventSeries: EventSeriesInput!) {
      createEventSeries(eventSeries: $eventSeries) {
        uuid
      }
    }
  `

  static getUpdateEventSeriesMutation = gql`
    mutation ($eventSeries: EventSeriesInput!) {
      updateEventSeries(eventSeries: $eventSeries)
    }
  `
  constructor(props) {
    super(Model.fillObject(props, EventSeries.yupSchema))
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
