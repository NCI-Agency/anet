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
  customFieldRef1,
  customField,
  customFieldEnum1,
  customFieldEnum2,
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

  static STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  }

  static APPROVAL_STEP_TYPE = {
    PLANNING_APPROVAL: "PLANNING_APPROVAL",
    REPORT_APPROVAL: "REPORT_APPROVAL"
  }

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
        .label(Settings.fields.task.shortName.label),
      longName: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.task.longName.label),
      category: yup.string().nullable().default(""),
      taskedOrganizations: yup
        .array()
        .nullable()
        .default([])
        .label(Settings.fields.task.taskedOrganizations.label),
      customFieldRef1: yup
        .object()
        .nullable()
        .default({})
        .label(customFieldRef1 && customFieldRef1.label),
      customFieldEnum1: yup
        .string()
        .nullable()
        .default("")
        .label(customFieldEnum1 && customFieldEnum1.label),
      customFieldEnum2: yup
        .string()
        .nullable()
        .default("")
        .label(customFieldEnum2 && customFieldEnum2.label),
      customField: yup
        .string()
        .nullable()
        .default("")
        .label(customField && customField.label),
      projectedCompletion: yupDate
        .nullable()
        .default(null)
        .label(projectedCompletion && projectedCompletion.label),
      plannedCompletion: yupDate
        .nullable()
        .default(null)
        .label(plannedCompletion && plannedCompletion.label),
      status: yup
        .string()
        .required()
        .default(() => Task.STATUS.ACTIVE),
      responsiblePositions: yup
        .array()
        .nullable()
        .default([])
        .label(responsiblePositions && responsiblePositions.label),
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
              .required("You must select at least one approver")
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
              .required("You must select at least one approver")
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
    "uuid, shortName, longName, customFieldRef1 { uuid, shortName } taskedOrganizations { uuid, shortName }, customFields"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Task.yupSchema))
  }

  isTopLevelTask() {
    return _isEmpty(this.customFieldRef1)
  }

  fieldSettings() {
    return this.isTopLevelTask()
      ? Settings.fields.task.topLevel
      : Settings.fields.task.subLevel
  }

  iconUrl() {
    return TASKS_ICON
  }

  toString() {
    return `${this.shortName}`
  }

  generalAssessmentsConfig() {
    return this.fieldSettings().assessments || []
  }

  instanceAssessmentsConfig() {
    // The given task instance might have a specific assessments config
    return utils.parseJsonSafe(this.customFields || "{}").assessments || []
  }
}
