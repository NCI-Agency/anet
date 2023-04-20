import Model, {
  createCustomFieldsSchema,
  NOTE_TYPE,
  REPORT_RELATED_OBJECT_TYPE,
  REPORT_STATE_PUBLISHED,
  yupDate
} from "components/Model"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import REPORTS_ICON from "resources/reports.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"
import Person from "./Person"
import Task from "./Task"

export default class Report extends Model {
  static resourceName = "Report"
  static listName = "reportList"
  static getInstanceName = "report"
  static relatedObjectType = REPORT_RELATED_OBJECT_TYPE

  static STATE = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    PUBLISHED: REPORT_STATE_PUBLISHED,
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

  static STATE_COLORS = {
    [Report.STATE.DRAFT]: "#bdbdaf",
    [Report.STATE.PENDING_APPROVAL]: "#848478",
    [Report.STATE.APPROVED]: "#75eb75",
    [Report.STATE.PUBLISHED]: "#5cb85c",
    [Report.STATE.CANCELLED]: "#ec971f",
    [Report.STATE.REJECTED]: "#c23030"
  }

  static ENGAGEMENT_STATUS = {
    HAPPENED: "HAPPENED",
    FUTURE: "FUTURE",
    CANCELLED: "CANCELLED"
  }

  static ENGAGEMENT_STATUS_LABELS = {
    [Report.ENGAGEMENT_STATUS.HAPPENED]: "Happened",
    [Report.ENGAGEMENT_STATUS.FUTURE]: "Future",
    [Report.ENGAGEMENT_STATUS.CANCELLED]: "Cancelled"
  }

  static CANCELLATION_REASON = {
    CANCELLED_BY_ADVISOR: "CANCELLED_BY_ADVISOR",
    CANCELLED_BY_PRINCIPAL: "CANCELLED_BY_PRINCIPAL",
    CANCELLED_DUE_TO_TRANSPORTATION: "CANCELLED_DUE_TO_TRANSPORTATION",
    CANCELLED_DUE_TO_FORCE_PROTECTION: "CANCELLED_DUE_TO_FORCE_PROTECTION",
    CANCELLED_DUE_TO_ROUTES: "CANCELLED_DUE_TO_ROUTES",
    CANCELLED_DUE_TO_THREAT: "CANCELLED_DUE_TO_THREAT",
    CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS:
      "CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS",
    CANCELLED_DUE_TO_NETWORK_ISSUES: "CANCELLED_DUE_TO_NETWORK_ISSUES"
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
        .when("cancelled", ([cancelled], schema) =>
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
          ([cancelled, engagementDate], schema) =>
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
          ([cancelled, atmosphere, engagementDate], schema) =>
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
        .test("location", "location error", (location, testContext) =>
          _isEmpty(location)
            ? testContext.createError({
              message: "You must provide the Location"
            })
            : true
        )
        .default({}),
      reportPeople: yup
        .array()
        .nullable()
        .when("cancelled", ([cancelled], schema) =>
          cancelled
            ? schema.nullable()
            : schema // Only do validation warning when engagement not cancelled
              .test(
                "primary-advisor",
                "primary advisor error",
                (reportPeople, testContext) => {
                  const message = Report.checkPrimaryAttendee(
                    reportPeople,
                    Person.ROLE.ADVISOR
                  )
                  return message ? testContext.createError({ message }) : true
                }
              )
              .test(
                "no-author",
                "no author error",
                (reportPeople, testContext) => {
                  const message = Report.checkAnyAuthor(reportPeople)
                  return message ? testContext.createError({ message }) : true
                }
              )
              .test(
                "attending-author",
                "no attending author error",
                (reportPeople, testContext) => {
                  const message = Report.checkAttendingAuthor(reportPeople)
                  return message ? testContext.createError({ message }) : true
                }
              )
              .test(
                "purposeless-people",
                "purposeless people error",
                (reportPeople, testContext) => {
                  const message = Report.checkUnInvolvedPeople(reportPeople)
                  return message ? testContext.createError({ message }) : true
                }
              )
        )
        .default([]),
      principalOrg: yup.object().nullable().default({}),
      advisorOrg: yup.object().nullable().default({}),
      tasks: yup
        .array()
        .nullable()
        .test("tasks", "tasks error", (tasks, testContext) =>
          _isEmpty(tasks)
            ? testContext.createError({
              message: `You must provide at least one ${Settings.fields.task.subLevel.shortLabel}`
            })
            : true
        )
        .default([]),
      comments: yup.array().nullable().default([]),
      reportText: yup
        .string()
        .nullable()
        .when("cancelled", ([cancelled], schema) =>
          cancelled
            ? schema.nullable()
            : schema.test(
              "reportText",
              "reportText error",
              (reportText, testContext) =>
                utils.isEmptyHtml(reportText)
                  ? testContext.createError({
                    message: `You must provide the ${Settings.fields.report.reportText}`
                  })
                  : true
            )
        )
        .default("")
        .label(Settings.fields.report.reportText),
      nextSteps: yup
        .string()
        .nullable()
        .when("engagementDate", ([engagementDate], schema) =>
          !Report.isFuture(engagementDate)
            ? schema.required(
              `You must provide a brief summary of the ${Settings.fields.report.nextSteps.label}`
            )
            : schema.nullable()
        )
        .default("")
        .label(Settings.fields.report.nextSteps.label),
      keyOutcomes: yup
        .string()
        .nullable()
        .when(
          ["cancelled", "engagementDate"],
          ([cancelled, engagementDate], schema) =>
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
      reportSensitiveInformation: yup
        .object()
        .nullable()
        .default({ uuid: null, text: null }),
      authorizationGroups: yup.array().nullable().default([])
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Report.customFieldsSchema)
    .concat(Model.yupSchema)

  static yupWarningSchema = yup.object().shape({
    reportPeople: yup
      .array()
      .nullable()
      .when("cancelled", ([cancelled], schema) =>
        cancelled
          ? schema.nullable()
          : schema // Only do validation warning when engagement not cancelled
            .test(
              "primary-principal",
              "primary principal error",
              (reportPeople, testContext) => {
                const message = Report.checkPrimaryAttendee(
                  reportPeople,
                  Person.ROLE.PRINCIPAL
                )
                return message ? testContext.createError({ message }) : true
              }
            )
      ),
    reportSensitiveInformation: yup.object().nullable().default({}),
    authorizationGroups: yup
      .array()
      .nullable()
      .when(
        ["reportSensitiveInformation", "reportSensitiveInformation.text"],
        (
          [reportSensitiveInformation, reportSensitiveInformationText],
          schema
        ) =>
          _isEmpty(reportSensitiveInformation) ||
          _isEmpty(reportSensitiveInformationText)
            ? schema.nullable()
            : schema.required(`You should provide authorization groups who can access the sensitive information.
            If you do not do so, you will remain the only one authorized to see the sensitive information you have entered`)
      )
  })

  static autocompleteQuery = "uuid, intent, authors { uuid, name, rank, role }"

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

  toString(displayCallback) {
    if (typeof displayCallback === "function") {
      return displayCallback(this)
    }
    return this.intent || "None"
  }

  static checkPrimaryAttendee(reportPeople, role) {
    const primaryAttendee = Report.getPrimaryAttendee(reportPeople, role)
    const roleName = Person.humanNameOfRole(role)
    if (!primaryAttendee && role === Person.ROLE.ADVISOR) {
      return `You must provide the primary ${roleName} for the Engagement`
    } else if (!primaryAttendee && role === Person.ROLE.PRINCIPAL) {
      return `No primary ${roleName} has been provided for the Engagement`
    } else if (primaryAttendee.status !== Model.STATUS.ACTIVE) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to have an active profile`
    } else if (
      primaryAttendee.endOfTourDate &&
      moment(primaryAttendee.endOfTourDate).isBefore(moment().startOf("day"))
    ) {
      return `The primary ${roleName}'s - ${primaryAttendee.name} - end of tour date has passed`
    } else if (!primaryAttendee.position) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to be assigned to a position`
    } else if (primaryAttendee.position.status !== Model.STATUS.ACTIVE) {
      return `The primary ${roleName} - ${primaryAttendee.name} - needs to be in an active position`
    }
  }

  static checkAttendingAuthor(reportPeople) {
    if (!reportPeople?.some(rp => rp.author && rp.attendee)) {
      return "You must provide at least 1 attending author"
    }
  }

  static checkAnyAuthor(reportPeople) {
    if (!reportPeople?.some(rp => rp.author)) {
      return "You must provide at least 1 author"
    }
  }

  // Report people shouldn't have any person who is both non-attending and non-author
  static checkUnInvolvedPeople(reportPeople) {
    if (reportPeople?.some(rp => !rp.author && !rp.attendee)) {
      return "You must remove the people who have no involvement (neither attending nor author) before submitting"
    }
  }

  static getPrimaryAttendee(reportPeople, role) {
    return reportPeople?.find(
      el => el.role === role && el.primary && el.attendee
    )
  }

  static sortReportPeople(reportPeople) {
    return [...reportPeople].sort((rp1, rp2) => {
      // primary first, then authors, then alphabetical
      if (rp1.primary !== rp2.primary) {
        return rp1.primary ? -1 : 1
      } else if (rp1.author !== rp2.author) {
        return rp1.author ? -1 : 1
      }
      return (rp1.name || rp1.uuid).localeCompare(rp2.name || rp2.uuid)
    })
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
        entityUuids: n.noteRelatedObjects
          .filter(ro => ro.relatedObjectType === entityType.relatedObjectType)
          .map(ro => ro.relatedObjectUuid),
        assessmentUuid: n.uuid,
        assessment: utils.parseJsonSafe(n.text),
        assessmentKey: n.assessmentKey
      }))
      .filter(n => !_isEmpty(n.entityUuids))
    // When updating the instant assessments, we need for each entity the uuid of the
    // related instant assessment
    const entitiesAssessmentsUuids = {}
    // Get initial entities assessments values
    const entitiesAssessments = {}
    notesToAssessments.forEach(m => {
      m.entityUuids.forEach(entityUuid => {
        const splittedKey = m.assessmentKey.split(".")
        const parsedKey = splittedKey.pop()
        entitiesAssessmentsUuids[entityUuid] = m.assessmentUuid
        entitiesAssessments[entityUuid] = entitiesAssessments[entityUuid] || {}
        entitiesAssessments[entityUuid][parsedKey] = m.assessment
      })
    })
    return {
      [entitiesAssessmentsUuidsFieldName]: entitiesAssessmentsUuids,
      [entitiesAssessmentsFieldName]: entitiesAssessments
    }
  }

  getTasksEngagementAssessments() {
    return this.getRelatedObjectsEngagementAssessments(
      Task,
      Report.TASKS_ASSESSMENTS_PARENT_FIELD,
      Report.TASKS_ASSESSMENTS_UUIDS_FIELD
    )
  }

  getAttendeesEngagementAssessments() {
    return this.getRelatedObjectsEngagementAssessments(
      Person,
      Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD,
      Report.ATTENDEES_ASSESSMENTS_UUIDS_FIELD
    )
  }

  static getReportSchema(report, tasks, reportPeople) {
    // Update the report schema according to the selected report tasks and attendees
    // instant assessments schema
    let reportSchema = Report.yupSchema
    const {
      assessmentsConfig: tasksInstantAssessmentsConfig,
      assessmentsSchema: tasksInstantAssessmentsSchema
    } = Task.getInstantAssessmentsDetailsForEntities(
      tasks,
      Report.TASKS_ASSESSMENTS_PARENT_FIELD,
      report
    )
    const {
      assessmentsConfig: attendeesInstantAssessmentsConfig,
      assessmentsSchema: attendeesInstantAssessmentsSchema
    } = Person.getInstantAssessmentsDetailsForEntities(
      reportPeople?.filter(rp => rp.attendee),
      Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD,
      report
    )
    if (!_isEmpty(tasksInstantAssessmentsConfig)) {
      reportSchema = reportSchema.concat(tasksInstantAssessmentsSchema)
    }
    if (!_isEmpty(attendeesInstantAssessmentsConfig)) {
      reportSchema = reportSchema.concat(attendeesInstantAssessmentsSchema)
    }
    return reportSchema
  }

  static hasConflict(report01, report02) {
    if (report01.uuid === report02.uuid) {
      return false // same report is not a conflicting report
    }

    // cancelled reports not counted as conflict
    if (
      Report.isCancelled(report01.state) ||
      Report.isCancelled(report02.state)
    ) {
      return false
    }
    let start01
    let end01

    if (
      !Settings.engagementsIncludeTimeAndDuration ||
      report01.duration === null
    ) {
      // It is an all-day event
      start01 = moment(report01.engagementDate).startOf("day")
      end01 = moment(report01.engagementDate).endOf("day")
    } else {
      start01 = moment(report01.engagementDate)
      end01 = moment(report01.engagementDate).add(report01.duration, "minute")
    }

    let start02
    let end02

    if (
      !Settings.engagementsIncludeTimeAndDuration ||
      report02.duration === null
    ) {
      // It is an all-day event
      start02 = moment(report02.engagementDate).startOf("day")
      end02 = moment(report02.engagementDate).endOf("day")
    } else {
      start02 = moment(report02.engagementDate)
      end02 = moment(report02.engagementDate).add(report02.duration, "minute")
    }

    return (
      start01.isSame(start02) ||
      (end01.isAfter(start02) && start01.isBefore(end02))
    )
  }

  static getFormattedEngagementDate(report) {
    if (!report?.engagementDate) {
      return ""
    }

    const start = moment(report.engagementDate)
    if (!report.duration) {
      return Settings.engagementsIncludeTimeAndDuration
        ? start.format(Settings.dateFormats.forms.displayLong.date) +
            " (all day)"
        : start.format(Report.getEngagementDateFormat())
    }

    const end = moment(report.engagementDate).add(report.duration, "minutes")

    return (
      start.format(Report.getEngagementDateFormat()) +
      end.format(
        start.isSame(end, "day")
          ? " - HH:mm"
          : " >>> " + Report.getEngagementDateFormat()
      )
    )
  }

  static FILTERED_CLIENT_SIDE_FIELDS = [
    "authors",
    "cancelled",
    "showSensitiveInfo",
    Report.TASKS_ASSESSMENTS_PARENT_FIELD,
    Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD,
    Report.TASKS_ASSESSMENTS_UUIDS_FIELD,
    Report.ATTENDEES_ASSESSMENTS_UUIDS_FIELD
  ]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Report.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Report.filterClientSideFields(this, ...additionalFields)
  }
}
