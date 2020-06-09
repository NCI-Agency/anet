import { Settings } from "api"
import Model, {
  createCustomFieldsSchema,
  NOTE_TYPE,
  yupDate
} from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Person, Position, Task } from "models"
import moment from "moment"
import REPORTS_ICON from "resources/reports.png"
import utils from "utils"
import * as yup from "yup"

export default class Report extends Model {
  static resourceName = "Report"
  static listName = "reportList"
  static getInstanceName = "report"
  static relatedObjectType = "reports"

  static STATE = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    PUBLISHED: "PUBLISHED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED"
  }

  static STATE_LABELS = {
    [Report.STATE.DRAFT]: "Draft",
    [Report.STATE.PENDING_APPROVAL]: "Pending Approval",
    [Report.STATE.APPROVED]: "Approved",
    [Report.STATE.PUBLISHED]: "Published",
    [Report.STATE.CANCELLED]: "Cancelled",
    [Report.STATE.REJECTED]: "Changes requested"
  }

  static ENGAGEMENT_STATUS = {
    HAPPENED: "HAPPENED",
    FUTURE: "FUTURE",
    CANCELLED: "CANCELLED"
  }

  static CANCELLATION_REASON = {
    CANCELLED_BY_ADVISOR: "CANCELLED_BY_ADVISOR",
    CANCELLED_BY_PRINCIPAL: "CANCELLED_BY_PRINCIPAL",
    CANCELLED_DUE_TO_TRANSPORTATION: "CANCELLED_DUE_TO_TRANSPORTATION",
    CANCELLED_DUE_TO_FORCE_PROTECTION: "CANCELLED_DUE_TO_FORCE_PROTECTION",
    CANCELLED_DUE_TO_ROUTES: "CANCELLED_DUE_TO_ROUTES",
    CANCELLED_DUE_TO_THREAT: "CANCELLED_DUE_TO_THREAT",
    CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS:
      "CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS"
  }

  static ATMOSPHERE = {
    POSITIVE: "POSITIVE",
    NEGATIVE: "NEGATIVE",
    NEUTRAL: "NEUTRAL"
  }

  static ATMOSPHERE_LABELS = {
    [Report.ATMOSPHERE.POSITIVE]: "Positive",
    [Report.ATMOSPHERE.NEGATIVE]: "Negative",
    [Report.ATMOSPHERE.NEUTRAL]: "Neutral"
  }

  static TASKS_ASSESSMENTS_PARENT_FIELD = "tasksAssessments"
  static TASKS_ASSESSMENTS_UUIDS_FIELD = "tasksAssessmentsUuids"
  static ATTENDEES_ASSESSMENTS_PARENT_FIELD = "attendeesAssessments"
  static ATTENDEES_ASSESSMENTS_UUIDS_FIELD = "attendeesAssessmentsUuids"

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(
    Settings.fields.report.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      intent: yup
        .string()
        .nullable()
        .required(`You must provide the ${Settings.fields.report.intent}`)
        .default("")
        .label(Settings.fields.report.intent),
      engagementDate: yupDate
        .nullable()
        .required("You must provide the Date of Engagement")
        .default(null),
      duration: yup.number().nullable().default(null),
      // not actually in the database, but used for validation:
      cancelled: yup
        .boolean()
        .default(false)
        .label(Settings.fields.report.cancelled),
      cancelledReason: yup
        .string()
        .nullable()
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema.required("You must provide a reason for cancellation")
            : schema.nullable()
        )
        .default(null),
      atmosphere: yup
        .string()
        .nullable()
        .when(
          ["cancelled", "engagementDate"],
          (cancelled, engagementDate, schema) =>
            cancelled
              ? schema.nullable()
              : !Report.isFuture(engagementDate)
                ? schema.required(
                  `You must provide the overall ${Settings.fields.report.atmosphere} of the engagement`
                )
                : schema.nullable()
        )
        .default(null)
        .label(Settings.fields.report.atmosphere),
      atmosphereDetails: yup
        .string()
        .nullable()
        .when(
          ["cancelled", "atmosphere", "engagementDate"],
          (cancelled, atmosphere, engagementDate, schema) =>
            cancelled
              ? schema.nullable()
              : !Report.isFuture(engagementDate)
                ? atmosphere === Report.ATMOSPHERE.POSITIVE
                  ? schema.nullable()
                  : schema.required(
                    `You must provide ${Settings.fields.report.atmosphereDetails} if the engagement was not Positive`
                  )
                : schema.nullable()
        )
        .default("")
        .label(Settings.fields.report.atmosphereDetails),
      location: yup
        .object()
        .nullable()
        .test(
          "location",
          "location error",
          // can't use arrow function here because of binding to 'this'
          function(location) {
            return _isEmpty(location)
              ? this.createError({ message: "You must provide the Location" })
              : true
          }
        )
        .default({}),
      attendees: yup
        .array()
        .nullable()
        .test(
          "primary-principal",
          "primary principal error",
          // can't use arrow function here because of binding to 'this'
          function(attendees) {
            const err = Report.checkPrimaryAttendee(
              attendees,
              Person.ROLE.PRINCIPAL
            )
            return err ? this.createError({ message: err }) : true
          }
        )
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema.nullable()
            : schema.test(
              "primary-advisor",
              "primary advisor error",
              // can't use arrow function here because of binding to 'this'
              function(attendees) {
                const err = Report.checkPrimaryAttendee(
                  attendees,
                  Person.ROLE.ADVISOR
                )
                return err ? this.createError({ message: err }) : true
              }
            )
        )
        .default([]),
      principalOrg: yup.object().nullable().default({}),
      advisorOrg: yup.object().nullable().default({}),
      tasks: yup
        .array()
        .nullable()
        .test(
          "tasks",
          "tasks error",
          // can't use arrow function here because of binding to 'this'
          function(tasks) {
            return _isEmpty(tasks)
              ? this.createError({
                message: `You must provide at least one ${Settings.fields.task.subLevel.shortLabel}`
              })
              : true
          }
        )
        .default([]),
      comments: yup.array().nullable().default([]),
      reportText: yup
        .string()
        .nullable()
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema.nullable()
            : schema.test(
              "reportText",
              "reportText error",
              // can't use arrow function here because of binding to 'this'
              function(reportText) {
                return utils.isEmptyHtml(reportText)
                  ? this.createError({
                    message: `You must provide the ${Settings.fields.report.reportText}`
                  })
                  : true
              }
            )
        )
        .default("")
        .label(Settings.fields.report.reportText),
      nextSteps: yup
        .string()
        .nullable()
        .when(["engagementDate"], (engagementDate, schema) =>
          !Report.isFuture(engagementDate)
            ? schema.required(
              `You must provide a brief summary of the ${Settings.fields.report.nextSteps}`
            )
            : schema.nullable()
        )
        .default("")
        .label(Settings.fields.report.nextSteps),
      keyOutcomes: yup
        .string()
        .nullable()
        .when(
          ["cancelled", "engagementDate"],
          (cancelled, engagementDate, schema) =>
            cancelled
              ? schema.nullable()
              : Settings.fields.report.keyOutcomes &&
                !Report.isFuture(engagementDate)
                ? schema.required(
                  `You must provide a brief summary of the ${Settings.fields.report.keyOutcomes}`
                )
                : schema.nullable()
        )
        .default("")
        .label(Settings.fields.report.keyOutcomes),
      tags: yup.array().nullable().default([]),
      reportTags: yup
        .array()
        .nullable()
        .default([])
        .label(Settings.fields.report.reportTags),
      reportSensitiveInformation: yup.object().nullable().default({}), // null?
      authorizationGroups: yup.array().nullable().default([])
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Report.customFieldsSchema)
    .concat(Model.yupSchema)

  static yupWarningSchema = yup.object().shape({
    reportSensitiveInformation: yup.object().nullable().default({}),
    authorizationGroups: yup
      .array()
      .nullable()
      .when(
        ["reportSensitiveInformation", "reportSensitiveInformation.text"],
        (reportSensitiveInformation, reportSensitiveInformationText, schema) =>
          _isEmpty(reportSensitiveInformation) ||
          _isEmpty(reportSensitiveInformationText)
            ? schema.nullable()
            : schema.required(`You should provide authorization groups who can access the sensitive information.
            If you do not do so, you will remain the only one authorized to see the sensitive information you have entered`)
      )
  })

  static autocompleteQuery = "uuid, intent, author { uuid, name, rank, role }"

  constructor(props) {
    super(Model.fillObject(props, Report.yupSchema))
  }

  static isDraft(state) {
    return state === Report.STATE.DRAFT
  }

  isDraft() {
    return Report.isDraft(this.state)
  }

  static isPending(state) {
    return state === Report.STATE.PENDING_APPROVAL
  }

  isPending() {
    return Report.isPending(this.state)
  }

  static isPublished(state) {
    return state === Report.STATE.PUBLISHED
  }

  isPublished() {
    return Report.isPublished(this.state)
  }

  static isRejected(state) {
    return state === Report.STATE.REJECTED
  }

  isRejected() {
    return Report.isRejected(this.state)
  }

  static isCancelled(state) {
    return state === Report.STATE.CANCELLED
  }

  isCancelled() {
    return Report.isCancelled(this.state)
  }

  static isFuture(engagementDate) {
    return engagementDate && moment().endOf("day").isBefore(engagementDate)
  }

  isFuture() {
    return Report.isFuture(this.engagementDate)
  }

  static isApproved(state) {
    return state === Report.STATE.APPROVED
  }

  isApproved() {
    return Report.isApproved(this.state)
  }

  static getStateForClassName(report) {
    return `${
      Report.isFuture(report.engagementDate) ? "future-" : ""
    }${report.state.toLowerCase()}`
  }

  getStateForClassName() {
    return Report.getStateForClassName(this)
  }

  showWorkflow() {
    return this.state && !this.isDraft()
  }

  iconUrl() {
    return REPORTS_ICON
  }

  toString() {
    return this.intent || "None"
  }

  static checkPrimaryAttendee(attendees, role) {
    const primaryAttendee = Report.getPrimaryAttendee(attendees, role)
    const roleName = Person.humanNameOfRole(role)
    if (!primaryAttendee) {
      return `You must provide the primary ${roleName} for the Engagement`
    } else if (primaryAttendee.status !== Person.STATUS.ACTIVE) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to have an active profile`
    } else if (
      primaryAttendee.endOfTourDate &&
      moment(primaryAttendee.endOfTourDate).isBefore(moment().startOf("day"))
    ) {
      return `The primary ${roleName}'s - ${primaryAttendee.name} - end of tour date has passed`
    } else if (!primaryAttendee.position) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to be assigned to a position`
    } else if (primaryAttendee.position.status !== Position.STATUS.ACTIVE) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to be in an active position`
    }
  }

  static getPrimaryAttendee(attendees, role) {
    return attendees.find(el => el.role === role && el.primary)
  }

  static getEngagementDateFormat() {
    return Settings.engagementsIncludeTimeAndDuration
      ? Settings.dateFormats.forms.displayLong.withTime
      : Settings.dateFormats.forms.displayLong.date
  }

  getReportApprovedAt() {
    if (this.workflow && this.isApproved()) {
      const actions = Object.assign([], this.workflow)
      const lastApprovalStep = actions.pop()
      return !lastApprovalStep ? "" : lastApprovalStep.createdAt
    } else {
    }
  }

  getRelatedObjectsEngagementAssessments(
    entityType,
    entitiesAssessmentsFieldName,
    entitiesAssessmentsUuidsFieldName
  ) {
    const notesToAssessments = this.notes
      .filter(
        n => n.type === NOTE_TYPE.ASSESSMENT && n.noteRelatedObjects.length > 1
      )
      .map(n => ({
        entityUuids: [
          n.noteRelatedObjects
            .filter(ro => ro.relatedObjectType === entityType.relatedObjectType)
            .map(ro => ro.relatedObjectUuid)
        ],
        assessmentUuid: n.uuid,
        assessment: utils.parseJsonSafe(n.text)
      }))
    // When updating the instant assessments, we need for each entity the uuid of the
    // related instant assessment
    const entitiesAssessmentsUuids = {}
    // Get initial entities assessments values
    const entitiesAssessments = {}
    notesToAssessments.forEach(m => {
      m.entityUuids.forEach(entityUuid => {
        entitiesAssessmentsUuids[entityUuid] = m.assessmentUuid
        entitiesAssessments[entityUuid] = m.assessment
      })
    })
    return {
      [entitiesAssessmentsUuidsFieldName]: entitiesAssessmentsUuids,
      [entitiesAssessmentsFieldName]: entitiesAssessments
    }
  }

  getTasksEngagementAssessments() {
    const a = this.getRelatedObjectsEngagementAssessments(
      Task,
      Report.TASKS_ASSESSMENTS_PARENT_FIELD,
      Report.TASKS_ASSESSMENTS_UUIDS_FIELD
    )
    return a
  }

  getAttendeesEngagementAssessments() {
    return this.getRelatedObjectsEngagementAssessments(
      Person,
      Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD,
      Report.ATTENDEES_ASSESSMENTS_UUIDS_FIELD
    )
  }
}
