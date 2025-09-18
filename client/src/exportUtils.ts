import { gql } from "@apollo/client"
import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import FileSaver from "file-saver"

const getEmailAddresses = () => `
  emailAddresses(network: $emailNetwork) {
    network
    address
  }
`
const getOrganizationFragment = (fields: string[] = []) => `
  fragment organizations on Query {
    organizations: organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "shortName") ? "shortName" : ""}
        ${shouldInclude(fields, "longName") ? "longName" : ""}
        ${shouldInclude(fields, "identificationCode") ? "identificationCode" : ""}
        ${shouldInclude(fields, "emailAddresses") ? getEmailAddresses() : ""}
      }
    }
  }
`
const getPersonFragment = (fields: string[] = []) => `
  fragment people on Query {
    people: personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "name") ? "name" : ""}
        ${shouldInclude(fields, "rank") ? "rank" : ""}
        ${shouldInclude(fields, "emailAddresses") ? getEmailAddresses() : ""}
        ${
          shouldInclude(fields, "position")
            ? `
          position {
            uuid
            name
            type
            role
            code
            location {
              uuid
              name
            }
            organization {
              uuid
              shortName
              longName
              identificationCode
            }
          }
        `
            : ""
        }
      }
    }
  }
`
const getPositionFragment = (fields: string[] = []) => `
  fragment positions on Query {
    positions: positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "name") ? "name" : ""}
        ${shouldInclude(fields, "code") ? "code" : ""}
        ${shouldInclude(fields, "type") ? "type" : ""}
        ${shouldInclude(fields, "role") ? "role" : ""}
        ${shouldInclude(fields, "status") ? "status" : ""}
        ${shouldInclude(fields, "emailAddresses") ? getEmailAddresses() : ""}
        ${
          shouldInclude(fields, "location")
            ? `
          location {
            uuid
            name
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "organization")
            ? `
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "person")
            ? `
          person {
            uuid
            name
            rank
          }
        `
            : ""
        }
      }
    }
  }
`
const getTaskFragment = (fields: string[] = []) => `
  fragment tasks on Query {
    tasks: taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "shortName") ? "shortName" : ""}
        ${shouldInclude(fields, "longName") ? "longName" : ""}
        ${shouldInclude(fields, "status") ? "status" : ""}
        ${
          shouldInclude(fields, "taskedOrganizations")
            ? `
          taskedOrganizations {
            uuid
            shortName
            longName
            identificationCode
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "parentTask")
            ? `
          parentTask {
            uuid
            shortName
          }
        `
            : ""
        }
      }
    }
  }
`
const getLocationFragment = (fields: string[] = []) => `
  fragment locations on Query {
    locations: locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "name") ? "name" : ""}
        ${shouldInclude(fields, "lat") ? "lat" : ""}
        ${shouldInclude(fields, "lng") ? "lng" : ""}
        ${shouldInclude(fields, "type") ? "type" : ""}
      }
    }
  }
`
const getReportFragment = (fields: string[] = []) => `
  fragment reports on Query {
    reports: reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "intent") ? "intent" : ""}
        ${shouldInclude(fields, "engagementDate") ? "engagementDate" : ""}
        ${shouldInclude(fields, "duration") ? "duration" : ""}
        ${shouldInclude(fields, "keyOutcomes") ? "keyOutcomes" : ""}
        ${shouldInclude(fields, "nextSteps") ? "nextSteps" : ""}
        ${shouldInclude(fields, "cancelledReason") ? "cancelledReason" : ""}
        ${shouldInclude(fields, "atmosphere") ? "atmosphere" : ""}
        ${shouldInclude(fields, "atmosphereDetails") ? "atmosphereDetails" : ""}
        ${shouldInclude(fields, "state") ? "state" : ""}
        ${
          shouldInclude(fields, "authors")
            ? `
          authors {
            uuid
            name
            rank
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "reportPeople")
            ? `
          reportPeople {
            uuid
            name
            rank
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "primaryAdvisor")
            ? `
          primaryAdvisor {
            uuid
            name
            rank
            position {
              uuid
              organization {
                uuid
                shortName
                longName
                identificationCode
              }
            }
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "primaryInterlocutor")
            ? `
          primaryInterlocutor {
            uuid
            name
            rank
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "advisorOrg")
            ? `
          advisorOrg {
            uuid
            shortName
            longName
            identificationCode
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "interlocutorOrg")
            ? `
          interlocutorOrg {
            uuid
            shortName
            longName
            identificationCode
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "location")
            ? `
          location {
            uuid
            name
            lat
            lng
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "tasks")
            ? `
          tasks {
            uuid
            shortName
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "workflow")
            ? `
          workflow {
            type
            createdAt
            step {
              uuid
              name
              approvers {
                uuid
                name
                person {
                  uuid
                  name
                  rank
                }
              }
            }
            person {
              uuid
              name
              rank
            }
          }
        `
            : ""
        }
        ${shouldInclude(fields, "updatedAt") ? "updatedAt" : ""}
      }
    }
  }
`
const getAuthorizationGroupFragment = (fields: string[] = []) => `
  fragment authorizationGroups on Query {
    communities: authorizationGroupList(query: $authorizationGroupQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "name") ? "name" : ""}
        ${shouldInclude(fields, "description") ? "description" : ""}
        ${shouldInclude(fields, "status") ? "status" : ""}
        ${shouldInclude(fields, "forSensitiveInformation") ? "forSensitiveInformation" : ""}
        communityRelatedObjects: authorizationGroupRelatedObjects {
          relatedObjectType
          relatedObject {
            ... on Organization {
              shortName
              ${getEmailAddresses()}
            }
            ... on Person {
              name
              rank
              ${getEmailAddresses()}
            }
            ... on Position {
              type
              name
              ${getEmailAddresses()}
            }
          }
        }
      }
    }
  }
`
const getEventFragment = (fields: string[] = []) => `
  fragment events on Query {
    events: eventList(query: $eventQuery) {
      pageNum
      pageSize
      totalCount
      list {
        ${shouldInclude(fields, "uuid") ? "uuid" : ""}
        ${shouldInclude(fields, "type") ? "type" : ""}
        ${shouldInclude(fields, "name") ? "name" : ""}
        ${shouldInclude(fields, "startDate") ? "startDate" : ""}
        ${shouldInclude(fields, "endDate") ? "endDate" : ""}
        ${
          shouldInclude(fields, "ownerOrg")
            ? `
          ownerOrg {
            ${shouldInclude(fields, "ownerOrg.uuid") ? "uuid" : ""}
            ${shouldInclude(fields, "ownerOrg.shortName") ? "shortName" : ""}
            ${shouldInclude(fields, "ownerOrg.longName") ? "longName" : ""}
            ${shouldInclude(fields, "ownerOrg.identificationCode") ? "identificationCode" : ""}
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "hostOrg")
            ? `
          hostOrg {
            ${shouldInclude(fields, "hostOrg.uuid") ? "uuid" : ""}
            ${shouldInclude(fields, "hostOrg.shortName") ? "shortName" : ""}
            ${shouldInclude(fields, "hostOrg.longName") ? "longName" : ""}
            ${shouldInclude(fields, "hostOrg.identificationCode") ? "identificationCode" : ""}
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "adminOrg")
            ? `
          adminOrg {
            ${shouldInclude(fields, "adminOrg.uuid") ? "uuid" : ""}
            ${shouldInclude(fields, "adminOrg.shortName") ? "shortName" : ""}
            ${shouldInclude(fields, "adminOrg.longName") ? "longName" : ""}
            ${shouldInclude(fields, "adminOrg.identificationCode") ? "identificationCode" : ""}
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "eventSeries")
            ? `
          eventSeries {
            ${shouldInclude(fields, "eventSeries.uuid") ? "uuid" : ""}
            ${shouldInclude(fields, "eventSeries.name") ? "name" : ""}
          }
        `
            : ""
        }
        ${
          shouldInclude(fields, "location")
            ? `
          location {
            ${shouldInclude(fields, "location.uuid") ? "uuid" : ""}
            ${shouldInclude(fields, "location.name") ? "name" : ""}
            ${shouldInclude(fields, "location.lat") ? "lat" : ""}
            ${shouldInclude(fields, "location.lng") ? "lng" : ""}
          }
        `
            : ""
        }
        ${shouldInclude(fields, "updatedAt") ? "updatedAt" : ""}
      }
    }
  }
`
const shouldInclude = (fields: string[], field: string): boolean => {
  return fields.length === 0 || fields.includes(field)
}

const buildGqlGetDataQuery = ({
  reportFields = [],
  personFields = [],
  positionFields = [],
  organizationFields = [],
  taskFields = [],
  locationFields = [],
  authorizationGroupFields = [],
  eventFields = []
}) => {
  const fragments = [
    getOrganizationFragment(organizationFields),
    getPersonFragment(personFields),
    getPositionFragment(positionFields),
    getTaskFragment(taskFields),
    getLocationFragment(locationFields),
    getReportFragment(reportFields),
    getAuthorizationGroupFragment(authorizationGroupFields),
    getEventFragment(eventFields)
  ]

  return gql`
    query (
      $includeOrganizations: Boolean!
      $organizationQuery: OrganizationSearchQueryInput
      $includePeople: Boolean!
      $personQuery: PersonSearchQueryInput
      $includePositions: Boolean!
      $positionQuery: PositionSearchQueryInput
      $includeTasks: Boolean!
      $taskQuery: TaskSearchQueryInput
      $includeLocations: Boolean!
      $locationQuery: LocationSearchQueryInput
      $includeReports: Boolean!
      $reportQuery: ReportSearchQueryInput
      $includeAuthorizationGroups: Boolean!
      $authorizationGroupQuery: AuthorizationGroupSearchQueryInput
      $includeEvents: Boolean!
      $eventQuery: EventSearchQueryInput
      $emailNetwork: String
    ) {
      ...organizations @include(if: $includeOrganizations)
      ...people @include(if: $includePeople)
      ...positions @include(if: $includePositions)
      ...tasks @include(if: $includeTasks)
      ...locations @include(if: $includeLocations)
      ...reports @include(if: $includeReports)
      ...authorizationGroups @include(if: $includeAuthorizationGroups)
      ...events @include(if: $includeEvents)
    }
    ${fragments.join("\n")}
  `
}

export const exportResults = (
  genericPreferences,
  userPreferences,
  searchQueryParams,
  queryTypes,
  exportType,
  contentType,
  maxNumberResults,
  setError
) => {
  const includeOrganizations = queryTypes.includes(
    SEARCH_OBJECT_TYPES.ORGANIZATIONS
  )
  const includePeople = queryTypes.includes(SEARCH_OBJECT_TYPES.PEOPLE)
  const includePositions = queryTypes.includes(SEARCH_OBJECT_TYPES.POSITIONS)
  const includeTasks = queryTypes.includes(SEARCH_OBJECT_TYPES.TASKS)
  const includeLocations = queryTypes.includes(SEARCH_OBJECT_TYPES.LOCATIONS)
  const includeReports = queryTypes.includes(SEARCH_OBJECT_TYPES.REPORTS)
  const includeAuthorizationGroups = queryTypes.includes(
    SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS
  )
  const includeEvents = queryTypes.includes(SEARCH_OBJECT_TYPES.EVENTS)

  const organizationsFields = getExportPreference("ORGANIZATIONS")
  const peopleFields = getExportPreference("PEOPLE")
  const positionsFields = getExportPreference("POSITIONS")
  const tasksFields = getExportPreference("TASKS")
  const locationsFields = getExportPreference("LOCATIONS")
  const reportsFields = getExportPreference("REPORTS")
  const authorizationGroupsFields = getExportPreference("AUTHORIZATION_GROUPS")
  const eventsFields = getExportPreference("EVENTS")

  const organizationQuery = !includeOrganizations
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "ASC"
      }
  const personQuery = !includePeople
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "ASC"
      }
  const positionQuery = !includePositions
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "ASC"
      }
  const taskQuery = !includeTasks
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "ASC"
      }
  const locationQuery = !includeLocations
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "ASC"
      }
  const reportQuery = !includeReports
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "ENGAGEMENT_DATE",
        sortOrder: "DESC"
      }
  const authorizationGroupQuery = !includeAuthorizationGroups
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "DESC"
      }
  const eventQuery = !includeEvents
    ? {}
    : {
        ...searchQueryParams,
        pageSize: maxNumberResults,
        sortBy: "NAME",
        sortOrder: "DESC"
      }
  const { emailNetwork } = searchQueryParams
  const variables = {
    includeOrganizations,
    organizationQuery,
    includePeople,
    personQuery,
    includePositions,
    positionQuery,
    includeTasks,
    taskQuery,
    includeLocations,
    locationQuery,
    includeReports,
    includeEvents,
    reportQuery,
    includeAuthorizationGroups,
    authorizationGroupQuery,
    eventQuery,
    emailNetwork
  }

  const gqlQuery = buildGqlGetDataQuery({
    organizationFields: organizationsFields,
    personFields: peopleFields,
    positionFields: positionsFields,
    taskFields: tasksFields,
    locationFields: locationsFields,
    reportFields: reportsFields,
    authorizationGroupFields: authorizationGroupsFields,
    eventFields: eventsFields
  })

  return API.queryExport(gqlQuery, variables, exportType, contentType)
    .then(blob => {
      FileSaver.saveAs(blob, `anet_export.${exportType}`)
    })
    .catch(error => setError(error))

  function getExportPreference(reportEntity: string): string[] {
    const preference =
      userPreferences.find(p => p.preference.name === reportEntity) ??
      genericPreferences.find(p => p.name === reportEntity)

    const value = preference?.value ?? preference?.defaultValue

    return value ? value.split(",") : []
  }
}
