import { gql } from "@apollo/client"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS, yupDate } from "components/Model"
import moment from "moment"
import EVENTS_ICON from "resources/events.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export default class Event extends Model {
  static resourceName = "Event"
  static listName = "eventList"
  static getInstanceName = "event"
  static relatedObjectType = "events"

  static displayName() {
    return "Event"
  }

  static EVENT_TYPES = {
    OTHER: "OTHER",
    CONFERENCE: "CONFERENCE",
    EXERCISE: "EXERCISE",
    VISIT_BAN: "VISIT_BAN"
  }

  static schema = {}

  static yupSchema = yup.object().shape({
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    type: yup.string().required().default(""),
    name: yup.string().required().default(""),
    description: yup.string().default(""),
    startDate: yupDate.required().default(null),
    endDate: yupDate
      .required()
      .when("startDate", ([startDate], schema) =>
        schema.test("endDate", "endDate error", (endDate, testContext) =>
          startDate && endDate && moment(endDate).isBefore(startDate)
            ? testContext.createError({
                message: `${Settings.fields.event.endDate?.label} must be after ${Settings.fields.event.startDate?.label}`
              })
            : true
        )
      )
      .default(null),
    outcomes: yup.string().default(""),
    ownerOrg: yup.object().nullable().default(null),
    hostOrg: yup.object().nullable().default(null),
    adminOrg: yup.object().nullable().default(null),
    eventSeries: yup.object().nullable().default({}),
    location: yup.object().nullable().default({}),
    tasks: yup.array().nullable().default([]),
    organizations: yup.array().nullable().default([]),
    people: yup.array().nullable().default([])
  })

  static autocompleteQuery = `
    uuid
    type
    name
    startDate
    endDate
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    location {
      uuid
      name
    }
   `

  static getEventQuery = gql`
    query ($uuid: String) {
      event(uuid: $uuid) {
        uuid
        status
        type
        name
        description
        startDate
        endDate
        outcomes
        isSubscribed
        updatedAt
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
        eventSeries {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
          lat
          lng
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        tasks {
          uuid
          shortName
          longName
          parentTask {
            uuid
            shortName
          }
          ascendantTasks {
            uuid
            shortName
            parentTask {
              uuid
            }
          }
        }
        organizations {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          location {
            uuid
            name
            lat
            lng
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
        people {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          position {
            uuid
            name
            type
            code
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            organization {
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
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
          }
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
    super(Model.fillObject(props, Event.yupSchema))
  }

  iconUrl() {
    return EVENTS_ICON
  }

  toString() {
    return this.name
  }

  static FILTERED_CLIENT_SIDE_FIELDS = ["tasks", "organizations", "people"]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Event.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Event.filterClientSideFields(this, ...additionalFields)
  }

  static getEventDateFormat() {
    return Settings.eventsIncludeStartAndEndTime
      ? Settings.dateFormats.forms.displayLong.withTime
      : Settings.dateFormats.forms.displayLong.date
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static humanNameOfType(type) {
    return utils.sentenceCase(type)
  }

  static getEventFilters(filterDefs) {
    return filterDefs?.reduce((accumulator, filter) => {
      accumulator[filter] = {
        label: Event.humanNameOfType(filter),
        queryVars: { type: filter }
      }
      return accumulator
    }, {})
  }

  static getReportEventFilters() {
    return Event.getEventFilters(Settings?.fields?.report?.event?.filter)
  }
}
