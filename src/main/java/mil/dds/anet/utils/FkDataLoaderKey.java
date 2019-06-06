package mil.dds.anet.utils;

// Foreign key batching data loaders
public enum FkDataLoaderKey {
  APPROVAL_STEP_APPROVERS, // approvalStep.approvers
  AUTHORIZATION_GROUP_POSITIONS, // authorizationGroup.positions
  NOTE_NOTE_RELATED_OBJECTS, // note.noteRelatedObjects
  NOTE_RELATED_OBJECT_NOTES, // noteRelatedObject.notes
  ORGANIZATION_APPROVAL_STEPS, // organization.approvalSteps
  PERSON_ORGANIZATIONS, // person.organizations
  PERSON_PERSON_POSITION_HISTORY, // person.personPositionHistory
  POSITION_ASSOCIATED_POSITIONS, // position.associatedPositions
  POSITION_CURRENT_POSITION_FOR_PERSON, // position.currentPositionForPerson
  POSITION_PERSON_POSITION_HISTORY, // position.personPositionHistory
  REPORT_ATTENDEES, // report.attendees
  REPORT_REPORT_ACTIONS, // report.reportActions
  REPORT_REPORT_SENSITIVE_INFORMATION, // report.reportSensitiveInformation
  REPORT_TAGS, // report.tags
  REPORT_TASKS, // report.tasks
  TASK_RESPONSIBLE_POSITIONS, // task.responsiblePositions
}
