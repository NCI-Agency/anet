import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import FileSaver from "file-saver"

const GQL_GET_ORGANIZATION_LIST = gql`
  fragment organizations on Query {
    organizations: organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        type
      }
    }
  }
`
const GQL_GET_PERSON_LIST = gql`
  fragment people on Query {
    people: personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        role
        emailAddress
        avatar(size: 32)
        position {
          uuid
          name
          type
          code
          location {
            uuid
            name
          }
          organization {
            uuid
            shortName
          }
        }
      }
    }
  }
`
const GQL_GET_POSITION_LIST = gql`
  fragment positions on Query {
    positions: positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
    }
  }
`
const GQL_GET_TASK_LIST = gql`
  fragment tasks on Query {
    tasks: taskList(query: $taskQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
      }
    }
  }
`
const GQL_GET_LOCATION_LIST = gql`
  fragment locations on Query {
    locations: locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        lat
        lng
      }
    }
  }
`

const GQL_GET_REPORT_LIST = gql`
  fragment reports on Query {
    reports: reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        engagementDate
        duration
        keyOutcomes
        nextSteps
        cancelledReason
        atmosphere
        atmosphereDetails
        state
        author {
          uuid
          name
          rank
          role
        }
        primaryAdvisor {
          uuid
          name
          rank
          role
        }
        primaryPrincipal {
          uuid
          name
          rank
          role
        }
        advisorOrg {
          uuid
          shortName
        }
        principalOrg {
          uuid
          shortName
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
        }
        tags {
          uuid
          name
          description
        }
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
                role
              }
            }
          }
          person {
            uuid
            name
            rank
            role
          }
        }
        updatedAt
      }
    }
  }
`
const GQL_GET_DATA = gql`
  query(
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
  ) {
    ...organizations @include(if: $includeOrganizations)
    ...people @include(if: $includePeople)
    ...positions @include(if: $includePositions)
    ...tasks @include(if: $includeTasks)
    ...locations @include(if: $includeLocations)
    ...reports @include(if: $includeReports)
  }

  ${GQL_GET_ORGANIZATION_LIST}
  ${GQL_GET_PERSON_LIST}
  ${GQL_GET_POSITION_LIST}
  ${GQL_GET_TASK_LIST}
  ${GQL_GET_LOCATION_LIST}
  ${GQL_GET_REPORT_LIST}
`

// Limit exports to the first 1000 results
const MAX_NR_OF_EXPORTS = 1000

export const exportResults = (
  searchQueryParams,
  queryTypes,
  exportType,
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
  const organizationQuery = !includeOrganizations
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const personQuery = !includePeople
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const positionQuery = !includePositions
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const taskQuery = !includeTasks
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const locationQuery = !includeLocations
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const reportQuery = !includeReports
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: MAX_NR_OF_EXPORTS,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    })
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
    reportQuery
  }
  return API.queryExport(GQL_GET_DATA, variables, exportType)
    .then(blob => {
      FileSaver.saveAs(blob, `anet_export.${exportType}`)
    })
    .catch(error => setError(error))
}
