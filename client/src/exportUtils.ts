import { gqlPaginationFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import { CATEGORY_EXPORT } from "components/preferences/PreferencesFieldSet"
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
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "shortName")}
        ${shouldInclude(fields, "longName")}
        ${shouldInclude(fields, "identificationCode")}
        ${shouldInclude(fields, "emailAddresses", getEmailAddresses())}
      }
    }
  }
`
const getPersonFragment = (fields: string[] = []) => `
  fragment people on Query {
    people: personList(query: $personQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(fields, "rank")}
        ${shouldInclude(fields, "emailAddresses", getEmailAddresses())}
        ${shouldInclude(
          fields,
          "position",
          `position {
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
          }`
        )}
      }
    }
  }
`
const getPositionFragment = (fields: string[] = []) => `
  fragment positions on Query {
    positions: positionList(query: $positionQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(fields, "code")}
        ${shouldInclude(fields, "type")}
        ${shouldInclude(fields, "role")}
        ${shouldInclude(fields, "status")}
        ${shouldInclude(fields, "emailAddresses", getEmailAddresses())}
        ${shouldInclude(
          fields,
          "location",
          `location {
            uuid
            name
          }`
        )}
        ${shouldInclude(
          fields,
          "organization",
          `organization {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "person",
          `person {
            uuid
            name
            rank
          }`
        )}
      }
    }
  }
`
const getTaskFragment = (fields: string[] = []) => `
  fragment tasks on Query {
    tasks: taskList(query: $taskQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "shortName")}
        ${shouldInclude(fields, "longName")}
        ${shouldInclude(fields, "status")}
        ${shouldInclude(
          fields,
          "taskedOrganizations",
          `taskedOrganizations {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "parentTask",
          `parentTask {
            uuid
            shortName
          }`
        )}
      }
    }
  }
`
const getLocationFragment = (fields: string[] = []) => `
  fragment locations on Query {
    locations: locationList(query: $locationQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(fields, "lat")}
        ${shouldInclude(fields, "lng")}
        ${shouldInclude(fields, "type")}
      }
    }
  }
`
const getReportFragment = (fields: string[] = []) => `
  fragment reports on Query {
    reports: reportList(query: $reportQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "intent")}
        ${shouldInclude(fields, "engagementDate")}
        ${shouldInclude(fields, "duration")}
        ${shouldInclude(fields, "keyOutcomes")}
        ${shouldInclude(fields, "nextSteps")}
        ${shouldInclude(fields, "cancelledReason")}
        ${shouldInclude(fields, "atmosphere")}
        ${shouldInclude(fields, "atmosphereDetails")}
        ${shouldInclude(fields, "state")}
        ${shouldInclude(
          fields,
          "authors",
          `authors {
            uuid
            name
            rank
          }`
        )}
        ${shouldInclude(
          fields,
          "reportPeople",
          `reportPeople {
            uuid
            name
            rank
          }`
        )}
        ${shouldInclude(
          fields,
          "primaryAdvisor",
          `primaryAdvisor {
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
          }`
        )}
        ${shouldInclude(
          fields,
          "primaryInterlocutor",
          `primaryInterlocutor {
            uuid
            name
            rank
          }`
        )}
        ${shouldInclude(
          fields,
          "advisorOrg",
          `advisorOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "interlocutorOrg",
          `interlocutorOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "location",
          `location {
            uuid
            name
            lat
            lng
          }`
        )}
        ${shouldInclude(
          fields,
          "tasks",
          `tasks {
            uuid
            shortName
          }`
        )}
        ${shouldInclude(
          fields,
          "workflow",
          `workflow {
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
          }`
        )}
        ${shouldInclude(fields, "updatedAt")}
      }
    }
  }
`
const getAuthorizationGroupFragment = (fields: string[] = []) => `
  fragment authorizationGroups on Query {
    communities: authorizationGroupList(query: $authorizationGroupQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(fields, "description")}
        ${shouldInclude(fields, "status")}
        ${shouldInclude(fields, "forSensitiveInformation")}
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
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "type")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(fields, "startDate")}
        ${shouldInclude(fields, "endDate")}
        ${shouldInclude(
          fields,
          "ownerOrg",
          `ownerOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "hostOrg",
          `hostOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "adminOrg",
          `adminOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "eventSeries",
          `eventSeries {
            uuid
            name
          }`
        )}
        ${shouldInclude(
          fields,
          "location",
          `location {
            uuid
            name
            lat
            lng
          }`
        )}
      }
    }
  }
`
const getEventSeriesFragment = (fields: string[] = []) => `
  fragment eventSeries on Query {
    eventSeries: eventSeriesList(query: $eventSeriesQuery) {
      ${gqlPaginationFields}
      list {
        ${shouldInclude(fields, "uuid")}
        ${shouldInclude(fields, "name")}
        ${shouldInclude(
          fields,
          "ownerOrg",
          `ownerOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "hostOrg",
          `hostOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
        ${shouldInclude(
          fields,
          "adminOrg",
          `adminOrg {
            uuid
            shortName
            longName
            identificationCode
          }`
        )}
      }
    }
  }
`

const shouldInclude = (
  fields: string[],
  field: string,
  gqlField?: string
): string => {
  return fields.length === 0 || fields.includes(field)
    ? (gqlField ?? field)
    : ""
}

const buildGqlGetDataQuery = ({
  reportFields = [],
  personFields = [],
  positionFields = [],
  organizationFields = [],
  taskFields = [],
  locationFields = [],
  authorizationGroupFields = [],
  eventFields = [],
  eventSeriesFields = []
}) => {
  const fragments = [
    getOrganizationFragment(organizationFields),
    getPersonFragment(personFields),
    getPositionFragment(positionFields),
    getTaskFragment(taskFields),
    getLocationFragment(locationFields),
    getReportFragment(reportFields),
    getAuthorizationGroupFragment(authorizationGroupFields),
    getEventFragment(eventFields),
    getEventSeriesFragment(eventSeriesFields)
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
      $includeEventSeries: Boolean!
      $eventSeriesQuery: EventSeriesSearchQueryInput
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
      ...eventSeries @include(if: $includeEventSeries)
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
  const includeEventSeries = queryTypes.includes(
    SEARCH_OBJECT_TYPES.EVENT_SERIES
  )

  const organizationsFields = getExportPreference(
    "ORGANIZATIONS",
    CATEGORY_EXPORT
  )
  const peopleFields = getExportPreference("PEOPLE", CATEGORY_EXPORT)
  const positionsFields = getExportPreference("POSITIONS", CATEGORY_EXPORT)
  const tasksFields = getExportPreference("TASKS", CATEGORY_EXPORT)
  const locationsFields = getExportPreference("LOCATIONS", CATEGORY_EXPORT)
  const reportsFields = getExportPreference("REPORTS", CATEGORY_EXPORT)
  const authorizationGroupsFields = getExportPreference(
    "AUTHORIZATION_GROUPS",
    CATEGORY_EXPORT
  )
  const eventsFields = getExportPreference("EVENTS", CATEGORY_EXPORT)
  const eventSeriesFields = getExportPreference("EVENT_SERIES", CATEGORY_EXPORT)

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
  const eventSeriesQuery = !includeEventSeries
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
    reportQuery,
    includeAuthorizationGroups,
    authorizationGroupQuery,
    includeEvents,
    eventQuery,
    includeEventSeries,
    eventSeriesQuery,
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
    eventFields: eventsFields,
    eventSeriesFields
  })

  return API.queryExport(gqlQuery, variables, exportType, contentType)
    .then(blob => {
      FileSaver.saveAs(blob, `anet_export.${exportType}`)
    })
    .catch(error => setError(error))

  function getExportPreference(
    preferenceName: string,
    preferenceCategory: string
  ): string[] {
    const preference =
      userPreferences.find(
        p =>
          p.preference.name === preferenceName &&
          p.preference.category === preferenceCategory
      ) ??
      genericPreferences.find(
        p => p.name === preferenceName && p.category === preferenceCategory
      )

    const value = preference?.value ?? preference?.defaultValue

    return value ? value.split(",") : []
  }
}
