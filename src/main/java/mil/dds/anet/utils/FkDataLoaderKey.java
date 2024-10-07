package mil.dds.anet.utils;

// Foreign key batching data loaders
public enum FkDataLoaderKey {
  APPROVAL_STEP_APPROVERS, // approvalStep.approvers
  ATTACHMENT_ATTACHMENT_RELATED_OBJECTS, // attachment.attachmentRelatedObjects
  ATTACHMENT_RELATED_OBJECT_ATTACHMENTS, // attachmentRelatedObject.attachments
  AUTHORIZATION_GROUP_ADMINISTRATIVE_POSITIONS, // authorizationGroup.administrativePositions
  AUTHORIZATION_GROUP_AUTHORIZATION_GROUP_RELATED_OBJECTS, // authorizationGroup.authorizationGroupRelatedObjects
  EMAIL_ADDRESSES_FOR_RELATED_OBJECT, // <relatedObject>.emailAddresses
  LOCATION_CHILDREN_LOCATIONS, // location.childrenLocations
  LOCATION_PARENT_LOCATIONS, // location.parentLocations
  NOTE_NOTE_RELATED_OBJECTS, // note.noteRelatedObjects
  NOTE_RELATED_OBJECT_NOTES, // noteRelatedObject.notes
  ORGANIZATION_ADMINISTRATIVE_POSITIONS, // organization.responsiblePositions
  PERSON_ORGANIZATIONS, // person.organizations
  PERSON_ORGANIZATIONS_WHEN, // person.organizations at a given date
  PERSON_PERSON_POSITION_HISTORY, // person.personPositionHistory
  POSITION_ASSOCIATED_POSITIONS, // position.associatedPositions
  POSITION_CURRENT_POSITION_FOR_PERSON, // position.currentPositionForPerson
  POSITION_PERSON_POSITION_HISTORY, // position.personPositionHistory
  RELATED_OBJECT_APPROVAL_STEPS, // <relatedObject>.approvalSteps
  RELATED_OBJECT_CUSTOM_SENSITIVE_INFORMATION, // <relatedObject>.customSensitiveInformation
  RELATED_OBJECT_PLANNING_APPROVAL_STEPS, // <relatedObject>.planningApprovalSteps
  REPORT_PEOPLE, // report.reportPeople
  REPORT_REPORT_ACTIONS, // report.reportActions
  REPORT_REPORT_SENSITIVE_INFORMATION, // report.reportSensitiveInformation
  REPORT_TASKS, // report.tasks
  TASK_RESPONSIBLE_POSITIONS, // task.responsiblePositions
  TASK_TASKED_ORGANIZATIONS, // task.taskedOrganizations
}
