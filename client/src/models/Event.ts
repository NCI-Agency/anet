import { gql } from "@apollo/client"
import Model, { GRAPHQL_ENTITY_AVATAR_FIELDS, yupDate } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export default class Event extends Model {
  static resourceName = "Event"
  static listName = "eventList"
  static getInstanceName = "Event"
  static relatedObjectType = "Event"

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
    description: yup.string().required().default(""),
    startDate: yupDate.required().default(null),
    endDate: yupDate.required().default(null),
    outcomes: yup.string().default(""),
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
      .default({}),
    eventSeries: yup.object().nullable().default({}),
    location: yup.object().nullable().default({}),
    tasks: yup.array().nullable().default([]),
    organizations: yup.array().nullable().default([]),
    people: yup.array().nullable().default([])
  })

  static autocompleteQuery = `
    uuid
    name
    description
    startDate
    endDate
    outcomes
    hostOrg {
      uuid
      shortName
    }
    adminOrg {
      uuid
      shortName
    }
    location {
      uuid
      name
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
        taskedOrganizations {
          uuid
          shortName
          longName
          identificationCode
        }
        customFields
    }
    organizations {
      uuid
      shortName
    }
    people {
      uuid
      name
    }
   `

  static getEventQueryNoIsSubscribed = gql`
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
        updatedAt
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
          description
        }
        location {
          uuid
          name
          lat
          lng
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
          taskedOrganizations {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          customFields
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
          }
        }
        people {
          uuid
          name
          rank
          status
          user
          endOfTourDate
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          position {
            uuid
            name
            type
            code
            status
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
            }
          }
        }
      }
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
          description
        }
        location {
          uuid
          name
          lat
          lng
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
          taskedOrganizations {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          customFields
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
          }
        }
        people {
          uuid
          name
          rank
          status
          user
          endOfTourDate
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          position {
            uuid
            name
            type
            code
            status
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
            }
          }
        }
      }
    }
  `

  static getEventListQuery = gql`
    query ($eventQuery: EventSearchQueryInput) {
      eventList(query: $eventQuery) {
        pageNum
        pageSize
        totalCount
        list {
          uuid
          status
          type
          name
          description
          startDate
          endDate
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
          }
          location {
            uuid
            name
            lat
            lng
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
            taskedOrganizations {
              uuid
              shortName
              longName
              identificationCode
            }
            customFields
          }
          organizations {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          people {
            uuid
            name
            rank
            status
            user
            endOfTourDate
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          updatedAt
        }
      }
    }
  `

  static getCreateEventMutation = gql`
    mutation ($event: EventInput!) {
      createEvent(event: $event) {
        uuid
      }
    }
  `

  static getUpdateEventMutation = gql`
    mutation ($event: EventInput!) {
      updateEvent(event: $event)
    }
  `
  constructor(props) {
    super(Model.fillObject(props, Event.yupSchema))
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
    return Settings.eventsIncludeTimeAndDuration
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
