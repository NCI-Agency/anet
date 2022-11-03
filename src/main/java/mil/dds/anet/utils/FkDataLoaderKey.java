package mil.dds.anet.utils;

// Foreign key batching data loaders
public enum FkDataLoaderKey {
  APPROVAL_STEP_APPROVERS, // approvalStep.approvers
  ATTACHMENT_RELATED_OBJECTS, // attachmentRelatedObject.attachments
  AUTHORIZATION_GROUP_POSITIONS, // authorizationGroup.positions
  NOTE_NOTE_RELATED_OBJECTS, // note.noteRelatedObjects
  NOTE_RELATED_OBJECT_NOTES, // noteRelatedObject.notes
  ORGANIZATION_ADMINISTRATIVE_POSITIONS, // organization.responsiblePositions
  PERSON_ORGANIZATIONS, // person.organizations
  PERSON_PERSON_POSITION_HISTORY, // person.personPositionHistory
  POSITION_ASSOCIATED_POSITIONS, // position.associatedPositions
  POSITION_AUTHORIZATION_GROUPS, // position.authorizationGroups
  POSITION_CURRENT_POSITION_FOR_PERSON, // position.currentPositionForPerson
  POSITION_PERSON_POSITION_HISTORY, // position.personPositionHistory
  RELATED_OBJECT_APPROVAL_STEPS, // <relatedObject, e.g. organization or task>.approvalSteps
  RELATED_OBJECT_ATTACHMENTS, // <relatedObject>.attachments
  RELATED_OBJECT_PLANNING_APPROVAL_STEPS, // <relatedObject>.planningApprovalSteps
  RELATED_OBJECT_CUSTOM_SENSITIVE_INFORMATION, // <relatedObject, e.g.
                                               // person>.customSensitiveInformation
  REPORT_PEOPLE, // report.reportPeople
  REPORT_REPORT_ACTIONS, // report.reportActions
  REPORT_REPORT_SENSITIVE_INFORMATION, // report.reportSensitiveInformation
  REPORT_TASKS, // report.tasks
  TASK_RESPONSIBLE_POSITIONS, // task.responsiblePositions
  TASK_TASKED_ORGANIZATIONS, // task.taskedOrganizations
}
