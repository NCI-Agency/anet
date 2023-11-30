import Model, {
  createCustomFieldsSchema,
  GRAPHQL_NOTES_FIELDS,
  yupDate
} from "components/Model"
import _isEmpty from "lodash/isEmpty"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export const {
  shortLabel,
  longLabel,
  parentTask,
  plannedCompletion,
  projectedCompletion,
  responsiblePositions
} = Settings.fields.task

export default class Task extends Model {
  static resourceName = "Task"
  static listName = "taskList"
  static getInstanceName = "task"
  static relatedObjectType = "tasks"

  static displayName() {
    return shortLabel
  }

  static APPROVAL_STEP_TYPE = {
    PLANNING_APPROVAL: "PLANNING_APPROVAL",
    REPORT_APPROVAL: "REPORT_APPROVAL"
  }

  static topLevelAssessmentDictionaryPath = "fields.task.topLevel.assessments"
  static subLevelAssessmentDictionaryPath = "fields.task.subLevel.assessments"

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(
    Settings.fields.task.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      shortName: yup
        .string()
        .required()
        .default("")
        .label(Settings.fields.task.shortName?.label),
      longName: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.task.longName?.label),
      description: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.task.description?.label),
      category: yup.string().nullable().default(""),
      taskedOrganizations: yup
        .array()
        .nullable()
        .default([])
        .label(Settings.fields.task.taskedOrganizations?.label),
      parentTask: yup.object().nullable().default({}).label(parentTask?.label),
      projectedCompletion: yupDate
        .nullable()
        .default(null)
        .label(projectedCompletion?.label),
      plannedCompletion: yupDate
        .nullable()
        .default(null)
        .label(plannedCompletion?.label),
      status: yup
        .string()
        .required()
        .default(() => Model.STATUS.ACTIVE),
      responsiblePositions: yup
        .array()
        .nullable()
        .default([])
        .label(responsiblePositions?.label),
      // FIXME: resolve code duplication in yup schema for approval steps
      planningApprovalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Task.APPROVAL_STEP_TYPE.PLANNING_APPROVAL),
            restrictedApproval: yup.boolean().default(false),
            approvers: yup
              .array()
              .required()
              .min(1, "You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([]),
      approvalSteps: yup
        .array()
        .of(
          yup.object().shape({
            name: yup
              .string()
              .required("You must provide the step name")
              .default(""),
            type: yup
              .string()
              .required()
              .default(() => Task.APPROVAL_STEP_TYPE.REPORT_APPROVAL),
            restrictedApproval: yup.boolean().default(false),
            approvers: yup
              .array()
              .required()
              .min(1, "You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([])
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Task.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid shortName longName parentTask { uuid shortName }" +
    " ascendantTasks { uuid shortName parentTask { uuid } }" +
    " taskedOrganizations { uuid shortName longName identificationCode } customFields"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Task.yupSchema))
  }

  isTopLevelTask() {
    return _isEmpty(this.parentTask)
  }

  fieldSettings() {
    return this.isTopLevelTask()
      ? Settings.fields.task.topLevel
      : Settings.fields.task.subLevel
  }

  getAssessmentDictionaryPath() {
    return this.isTopLevelTask()
      ? Task.topLevelAssessmentDictionaryPath
      : Task.subLevelAssessmentDictionaryPath
  }

  iconUrl() {
    return TASKS_ICON
  }

  toString() {
    return `${this.shortName}`
  }

  getAssessmentsConfig() {
    return this.fieldSettings().assessments || {}
  }

  static FILTERED_CLIENT_SIDE_FIELDS = ["ascendantTasks"]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Task.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Task.filterClientSideFields(this, ...additionalFields)
  }
}
