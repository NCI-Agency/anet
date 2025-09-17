import Model, {
  createCustomFieldsSchema,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  yupDate
} from "components/Model"
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

  static assessmentDictionaryPath = "fields.task.assessments"

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
      selectable: yup
        .boolean()
        .default(true)
        .label(Settings.fields.task.selectable?.label),
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
        .default([]),
      assessments: yup.array().nullable().default([])
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Task.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid shortName longName parentTask { uuid shortName }" +
    " ascendantTasks { uuid shortName parentTask { uuid } }" +
    ` taskedOrganizations { uuid shortName longName identificationCode ${GRAPHQL_ENTITY_AVATAR_FIELDS} } customFields`

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Task.yupSchema))
  }

  getAssessmentDictionaryPath() {
    return Task.assessmentDictionaryPath
  }

  iconUrl() {
    return TASKS_ICON
  }

  toString(displayCallback) {
    if (typeof displayCallback === "function") {
      return displayCallback(this)
    }
    return `${this.shortName}`
  }

  getAssessmentsConfig() {
    return Settings.fields.task.assessments || {}
  }

  static FILTERED_CLIENT_SIDE_FIELDS = ["ascendantTasks", "descendantTasks"]

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
