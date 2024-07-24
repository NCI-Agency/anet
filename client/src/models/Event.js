import { gql } from "@apollo/client"
import Model, { yupDate } from "components/Model"
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
    hostOrg: yup.object().required().default({}),
    adminOrg: yup.object().required().default({}),
    eventSeries: yup.object().nullable().default({}),
    location: yup.object().nullable().default({})
  })

  static autocompleteQuery = `
    uuid
    name
    description
    startDate
    endDate
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
   `

  static basicFieldsQuery =
    "uuid type name description hostOrg adminOrg eventSeries location startDate endDate outcomes"

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
        }
        adminOrg {
          uuid
          shortName
          longName
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
          }
          adminOrg {
            uuid
            shortName
            longName
            identificationCode
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

  static getEventDateFormat() {
    return Settings.engagementsIncludeTimeAndDuration
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
