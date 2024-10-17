import { gql } from "@apollo/client"
import { SEARCH_OBJECT_TYPES } from "actions"
import API from "api"
import FileSaver from "file-saver"

const GQL_EMAIL_ADDRESSES = `
  emailAddresses(network: $emailNetwork) {
    network
    address
  }
`
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
        ${GQL_EMAIL_ADDRESSES}
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
        ${GQL_EMAIL_ADDRESSES}
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
        role
        status
        ${GQL_EMAIL_ADDRESSES}
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
        person {
          uuid
          name
          rank
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
        status
        taskedOrganizations {
          uuid
          shortName
          longName
          identificationCode
        }
        parentTask {
          uuid
          shortName
        }
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
        type
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
        authors {
          uuid
          name
          rank
        }
        reportPeople {
          uuid
          name
          rank
        }
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
        primaryInterlocutor {
          uuid
          name
          rank
        }
        advisorOrg {
          uuid
          shortName
          longName
          identificationCode
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
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
        updatedAt
      }
    }
  }
`
const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  fragment authorizationGroups on Query {
    authorizationGroups: authorizationGroupList(query: $authorizationGroupQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        description
        status
        authorizationGroupRelatedObjects {
          relatedObjectType
          relatedObject {
            ... on Organization {
              shortName
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Person {
              name
              rank
              ${GQL_EMAIL_ADDRESSES}
            }
            ... on Position {
              type
              name
              ${GQL_EMAIL_ADDRESSES}
            }
          }
        }
      }
    }
  }
`

const GQL_GET_DATA = gql`
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
    $emailNetwork: String
  ) {
    ...organizations @include(if: $includeOrganizations)
    ...people @include(if: $includePeople)
    ...positions @include(if: $includePositions)
    ...tasks @include(if: $includeTasks)
    ...locations @include(if: $includeLocations)
    ...reports @include(if: $includeReports)
    ...authorizationGroups @include(if: $includeAuthorizationGroups)
  }

  ${GQL_GET_ORGANIZATION_LIST}
  ${GQL_GET_PERSON_LIST}
  ${GQL_GET_POSITION_LIST}
  ${GQL_GET_TASK_LIST}
  ${GQL_GET_LOCATION_LIST}
  ${GQL_GET_REPORT_LIST}
  ${GQL_GET_AUTHORIZATION_GROUP_LIST}
`
export const exportResults = (
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
  const organizationQuery = !includeOrganizations
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const personQuery = !includePeople
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const positionQuery = !includePositions
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const taskQuery = !includeTasks
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const locationQuery = !includeLocations
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "ASC"
    })
  const reportQuery = !includeReports
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "ENGAGEMENT_DATE",
      sortOrder: "DESC"
    })
  const authorizationGroupQuery = !includeAuthorizationGroups
    ? {}
    : Object.assign({}, searchQueryParams, {
      pageSize: maxNumberResults,
      sortBy: "NAME",
      sortOrder: "DESC"
    })
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
    emailNetwork
  }
  return API.queryExport(GQL_GET_DATA, variables, exportType, contentType)
    .then(blob => {
      FileSaver.saveAs(blob, `anet_export.${exportType}`)
    })
    .catch(error => setError(error))
}
