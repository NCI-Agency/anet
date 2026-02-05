// Definitions of GraphQL fields for commonly used entities

const gqlMinimalEntityFields = `
  uuid
  status
`

const gqlCommonEntityFields = `
  createdAt
  updatedAt
`

const gqlCommonSubscribableEntityFields = `
  ${gqlCommonEntityFields}
  isSubscribed
`

// Attachment
export const gqlMinimalAttachmentFields = `
  uuid
  caption
  fileName
  mimeType
  contentLength
`

export const gqlBasicAttachmentFields = `
  ${gqlMinimalAttachmentFields}
  createdAt
  updatedAt
  classification
  description
`

export const gqlAllAttachmentFields = `
  ${gqlBasicAttachmentFields}
`

export const gqlMinimalAuthorizationGroupFields = `
  ${gqlMinimalEntityFields}
  name
  description
`

// AuthorizationGroup
export const gqlBasicAuthorizationGroupFields = `
  ${gqlMinimalAuthorizationGroupFields}
  ${gqlCommonSubscribableEntityFields}
  distributionList
  forSensitiveInformation
`

export const gqlAllAuthorizationGroupFields = `
  ${gqlBasicAuthorizationGroupFields}
`

// Event
export const gqlMinimalEventFields = `
  ${gqlMinimalEntityFields}
  name
`

export const gqlBasicEventFields = `
  ${gqlMinimalEventFields}
  ${gqlCommonSubscribableEntityFields}
  startDate
  endDate
`

export const gqlAllEventFields = `
  ${gqlBasicEventFields}
  description
  outcomes
  customFields
`

// EventSeries
export const gqlMinimalEventSeriesFields = `
  ${gqlMinimalEntityFields}
  name
`

export const gqlBasicEventSeriesFields = `
  ${gqlMinimalEventSeriesFields}
  ${gqlCommonSubscribableEntityFields}
`

export const gqlAllEventSeriesFields = `
  ${gqlBasicEventSeriesFields}
  description
  customFields
`

// EventType
export const gqlMinimalEventTypeFields = `
  ${gqlMinimalEntityFields}
  name
`

export const gqlBasicEventTypeFields = `
  ${gqlMinimalEventTypeFields}
  ${gqlCommonEntityFields}
`

export const gqlAllEventTypeFields = `
  ${gqlBasicEventTypeFields}
  relatedEventsCount
`

// Location
export const gqlMinimalLocationFields = `
  ${gqlMinimalEntityFields}
  name
`

export const gqlBasicLocationFields = `
  ${gqlMinimalLocationFields}
  ${gqlCommonSubscribableEntityFields}
  digram
  trigram
  lat
  lng
  type
`

export const gqlAllLocationFields = `
  ${gqlBasicLocationFields}
  description
  geoJson
  customFields
`

// Organization
export const gqlMinimalOrganizationFields = `
  ${gqlMinimalEntityFields}
  shortName
  longName
  identificationCode
`

export const gqlBasicOrganizationFields = `
  ${gqlMinimalOrganizationFields}
  ${gqlCommonSubscribableEntityFields}
  app6context
  app6standardIdentity
  app6symbolSet
  app6hq
  app6amplifier
  app6entity
  app6entityType
  app6entitySubtype
  app6sectorOneModifier
  app6sectorTwoModifier
`

export const gqlAllOrganizationFields = `
  ${gqlBasicOrganizationFields}
  profile
  customFields
`

// Person
export const gqlMinimalPersonFields = `
  ${gqlMinimalEntityFields}
  name
  rank
  code
  user
`

export const gqlBasicPersonFields = `
  ${gqlMinimalPersonFields}
  ${gqlCommonSubscribableEntityFields}
  endOfTourDate
  gender
  phoneNumber
  pendingVerification
  obsoleteCountry
`

export const gqlAllPersonFields = `
  ${gqlBasicPersonFields}
  biography
  customFields
`

// Position
export const gqlMinimalPositionFields = `
  ${gqlMinimalEntityFields}
  name
  code
`

export const gqlBasicPositionFields = `
  ${gqlMinimalPositionFields}
  ${gqlCommonSubscribableEntityFields}
  role
  type
  superuserType
`

export const gqlAllPositionFields = `
  ${gqlBasicPositionFields}
  description
  customFields
`

// Report
export const gqlMinimalReportFields = `
  uuid
  state
  intent
  engagementDate
`

export const gqlBasicReportFields = `
  ${gqlMinimalReportFields}
  ${gqlCommonSubscribableEntityFields}
  createdAt
  updatedAt
  isSubscribed
  keyOutcomes
  nextSteps
  classification
  duration
  atmosphere
  atmosphereDetails
  cancelledReason
  releasedAt
  exsum
`

export const gqlAllReportFields = `
  ${gqlBasicReportFields}
  reportText
  customFields
`

// ReportPerson
const gqlReportPersonFields = `
  author
  attendee
  interlocutor
  primary
`

export const gqlMinimalReportPersonFields = `
  ${gqlMinimalPersonFields}
  ${gqlReportPersonFields}
`

// Task
export const gqlMinimalTaskFields = `
  ${gqlMinimalEntityFields}
  shortName
  longName
`

export const gqlBasicTaskFields = `
  ${gqlMinimalTaskFields}
  ${gqlCommonSubscribableEntityFields}
  selectable
  category
  plannedCompletion
  projectedCompletion
`

export const gqlAllTaskFields = `
  ${gqlBasicTaskFields}
  description
  customFields
`

// Commonly used sub-entities

export const gqlEntityAvatarFields = `
  entityAvatar {
    attachmentUuid
    applyCrop
    cropLeft
    cropTop
    cropWidth
    cropHeight
  }
`

// Entity type --> GQL query
export const gqlEntityFieldsMap = {
  Report: gqlMinimalReportFields,
  Person: `${gqlMinimalPersonFields} ${gqlEntityAvatarFields}`,
  ReportPerson: `${gqlMinimalReportPersonFields} ${gqlEntityAvatarFields}`,
  Organization: `${gqlMinimalOrganizationFields} ${gqlEntityAvatarFields}`,
  Position: `${gqlMinimalPositionFields} ${gqlEntityAvatarFields}`,
  Location: `${gqlMinimalLocationFields} ${gqlEntityAvatarFields}`,
  Task: gqlMinimalTaskFields,
  AuthorizationGroup: gqlMinimalAuthorizationGroupFields,
  Attachment: gqlMinimalAttachmentFields,
  Event: `${gqlMinimalEventFields} ${gqlEntityAvatarFields}`,
  EventSeries: `${gqlMinimalEventSeriesFields} ${gqlEntityAvatarFields}`
}

// Assorted other objects

export const gqlNoteFields = `
  uuid
  createdAt
  updatedAt
  text
  author {
    ${gqlEntityFieldsMap.Person}
  }
  noteRelatedObjects {
    objectUuid
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on AuthorizationGroup {
        ${gqlEntityFieldsMap.AuthorizationGroup}
      }
      ... on Location {
        ${gqlEntityFieldsMap.Location}
      }
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
      }
      ... on Position {
        ${gqlEntityFieldsMap.Position}
      }
      ... on Report {
        ${gqlEntityFieldsMap.Report}
      }
      ... on Task {
        ${gqlEntityFieldsMap.Task}
      }
    }
  }
`

export const gqlNotesFields = `
  notes {
    ${gqlNoteFields}
  }
`

export const gqlAssessmentFields = `
  uuid
  createdAt
  updatedAt
  assessmentKey
  assessmentValues
  author {
    ${gqlEntityFieldsMap.Person}
  }
  assessmentRelatedObjects {
    objectUuid
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
      }
      ... on Report {
        ${gqlEntityFieldsMap.Report}
      }
      ... on Task {
        ${gqlEntityFieldsMap.Task}
      }
    }
  }
`

export const gqlAssessmentsFields = `
  assessments {
    ${gqlAssessmentFields}
  }
`

export const gqlPreferenceFields = `
  uuid
  name
  type
  category
  description
  defaultValue
  allowedValues
`

export const gqlSavedSearchFields = `
  uuid
  name
  objectType
  query
  displayInHomepage
  priority
  homepagePriority
`

export const gqlSubscriptionFields = `
  uuid
  createdAt
  updatedAt
  subscribedObjectType
  subscribedObjectUuid
`

export const gqlSubscriptionUpdateFields = `
  createdAt
  isNote
  updatedObjectType
  updatedObjectUuid
`

export const gqlRelatedObjectFields = `
  ... on AuthorizationGroup {
    ${gqlEntityFieldsMap.AuthorizationGroup}
  }
  ... on Event {
    ${gqlEntityFieldsMap.Event}
  }
  ... on EventSeries {
    ${gqlEntityFieldsMap.EventSeries}
  }
  ... on Location {
    ${gqlEntityFieldsMap.Location}
  }
  ... on Organization {
    ${gqlEntityFieldsMap.Organization}
  }
  ... on Person {
    ${gqlEntityFieldsMap.Person}
  }
  ... on Position {
    ${gqlEntityFieldsMap.Position}
  }
  ... on Report {
    ${gqlEntityFieldsMap.Report}
  }
  ... on Task {
    ${gqlEntityFieldsMap.Task}
  }
`

export const gqlApprovalStepFields = `
  uuid
  name
  restrictedApproval
  nextStepUuid
  approvers {
    ${gqlEntityFieldsMap.Position}
    person {
      ${gqlEntityFieldsMap.Person}
    }
  }
`

export const gqlAttachmentRelatedObjectsFields = `
  attachmentRelatedObjects {
    relatedObjectUuid
    relatedObjectType
    relatedObject {
      ${gqlRelatedObjectFields}
    }
  }
`

export const gqlEmailAddressesFields = `
  emailAddresses {
    network
    address
  }
`

export const gqlEmailAddressesForNetworkFields = `
  emailAddresses(network: $emailNetwork) {
    network
    address
  }
`

export const gqlAuthorizationGroupMembersFields = `
  authorizationGroupRelatedObjects {
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
      }
      ... on Position {
        ${gqlEntityFieldsMap.Position}
      }
    }
  }
`

export const gqlAuthorizationGroupMembersWithEmailFields = `
  authorizationGroupRelatedObjects {
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
        ${gqlEmailAddressesFields}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
        ${gqlEmailAddressesFields}
      }
      ... on Position {
        ${gqlEntityFieldsMap.Position}
        ${gqlEmailAddressesFields}
      }
    }
  }
`

export const gqlAuthorizationGroupMembersWithEmailNetworkFields = `
  authorizationGroupRelatedObjects {
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
        ${gqlEmailAddressesForNetworkFields}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
        ${gqlEmailAddressesForNetworkFields}
      }
      ... on Position {
        ${gqlEntityFieldsMap.Position}
        ${gqlEmailAddressesForNetworkFields}
      }
    }
  }
`

export const gqlAuthorizedMembersFields = `
  authorizedMembers {
    relatedObjectType
    relatedObjectUuid
    relatedObject {
      ... on AuthorizationGroup {
        ${gqlEntityFieldsMap.AuthorizationGroup}
      }
      ... on Organization {
        ${gqlEntityFieldsMap.Organization}
      }
      ... on Person {
        ${gqlEntityFieldsMap.Person}
      }
      ... on Position {
        ${gqlEntityFieldsMap.Position}
      }
    }
  }
`
export const gqlReportCommunitiesFields = `
  reportCommunities {
    ${gqlEntityFieldsMap.AuthorizationGroup}
  }
`

export const gqlReportCommentsFields = `
  comments {
    uuid
    text
    createdAt
    updatedAt
    author {
      ${gqlEntityFieldsMap.Person}
    }
  }
`
export const gqlReportSensitiveInformationFields = `
  reportSensitiveInformation {
    uuid
    text
  }
`
export const gqlReportWorkflowFields = `
  workflow {
    type
    createdAt
    step {
      ${gqlApprovalStepFields}
    }
    person {
      ${gqlEntityFieldsMap.Person}
    }
  }
`

export const gqlCustomSensitiveInformationFields = `
  customSensitiveInformation {
    uuid
    customFieldName
    customFieldValue
  }
`

export const gqlUsersFields = `
  users {
    uuid
    domainUsername
  }
`

export const gqlAdminSettingsFields = `
  adminSettings {
    key
    value
  }
`

export const gqlPaginationFields = `
  pageNum
  pageSize
  totalCount
`
