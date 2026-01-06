import {
  gqlAllAttachmentFields,
  gqlAllEventFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import Model, { yupDate } from "components/Model"
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

  static schema = {}

  static yupSchema = yup.object().shape({
    status: yup
      .string()
      .required()
      .default(() => Model.STATUS.ACTIVE),
    type: yup
      .string()
      .nullable()
      .required("Event type is required")
      .default(null),
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
    ${gqlEntityFieldsMap.Event}
    type
    startDate
    endDate
    location {
      ${gqlEntityFieldsMap.Location}
    }
   `

  constructor(props) {
    super(Model.fillObject(props, Event.yupSchema))
  }

  static getEventQuery = gql`
    query ($uuid: String) {
      event(uuid: $uuid) {
        ${gqlAllEventFields}
        ${gqlEntityAvatarFields}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        eventSeries {
          ${gqlEntityFieldsMap.EventSeries}
        }
        location {
          ${gqlEntityFieldsMap.Location}
          lat
          lng
          type
        }
        tasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
          ascendantTasks {
            ${gqlEntityFieldsMap.Task}
            parentTask {
              ${gqlEntityFieldsMap.Task}
            }
          }
        }
        organizations {
          ${gqlEntityFieldsMap.Organization}
          location {
            ${gqlEntityFieldsMap.Location}
            lat
            lng
            type
          }
        }
        people {
          ${gqlEntityFieldsMap.Person}
          position {
            ${gqlEntityFieldsMap.Position}
            organization {
              ${gqlEntityFieldsMap.Organization}
            }
            location {
              ${gqlEntityFieldsMap.Location}
              lat
              lng
              type
            }
          }
        }
        attachments {
          ${gqlAllAttachmentFields}
        }
      }
    }
  `

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
