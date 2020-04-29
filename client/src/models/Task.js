import { Settings } from "api"
import Model, {
  ASSESSMENTS_RECURRENCE_TYPE,
  ASSESSMENTS_RELATED_OBJECT_TYPE,
  createCustomFieldsSchema,
  NOTE_TYPE,
  yupDate
} from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import TASKS_ICON from "resources/tasks.png"
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
    return JSON.parse(this.customFields || "{}").assessments || []
  }

  getInstantAssessmentResults(
    dateRange,
    relatedObjectType = ASSESSMENTS_RELATED_OBJECT_TYPE.REPORT
  ) {
    // FIXME: don't retrieve the published reports but also return the note's
    // relatedObject and filter on its status
    const publishedReportsUuids = this.publishedReports.map(r => r.uuid)
    const assessmentsNotes = this.notes
      .filter(
        n =>
          n.type === NOTE_TYPE.ASSESSMENT &&
          n.noteRelatedObjects.filter(
            ro =>
              ro.relatedObjectType === Report.relatedObjectType &&
              publishedReportsUuids.includes(ro.relatedObjectUuid)
          ).length &&
          // FIXME: make sure we actually filter on the report's engagementDate
          (!dateRange ||
            (n.createdAt <= dateRange.end && n.createdAt >= dateRange.start))
      )
      .map(note => ({ note: note, assessment: JSON.parse(note.text) }))
      .filter(
        obj =>
          obj.assessment.__recurrence === ASSESSMENTS_RECURRENCE_TYPE.ONCE &&
          obj.assessment.__relatedObjectType === relatedObjectType
      )
    const assessmentsResults = {}
    assessmentsNotes.forEach(n => {
      const a = n.assessment
      Object.keys(a).forEach(k => {
        if (!Object.prototype.hasOwnProperty.call(assessmentsResults, k)) {
          assessmentsResults[k] = []
        }
        assessmentsResults[k].push(a[k])
      })
    })
    return assessmentsResults
  }
}
