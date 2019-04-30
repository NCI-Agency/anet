import { Settings } from "api"
import Model, { yupDate } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import REPORTS_ICON from "resources/reports.png"
import utils from "utils"
import * as yup from "yup"

export default class Report extends Model {
  static resourceName = "Report"
  static listName = "reportList"
  static getInstanceName = "report"
  static getModelNameLinkTo = "report"

  static STATE = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    PUBLISHED: "PUBLISHED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
    FUTURE: "FUTURE"
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
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema
            : schema.test(
              "future-engagement",
              "You cannot submit reports for future dates, except for cancelled engagements",
              engagementDate =>
                !moment(engagementDate).isAfter(moment().endOf("day"))
            )
        )
        .default(null),
      duration: yup
        .number()
        .integer()
        .nullable()
        .positive()
        .default(null),
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
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema.nullable()
            : schema.required(
              `You must provide the overall ${
                Settings.fields.report.atmosphere
              } of the engagement`
            )
        )
        .default(null)
        .label(Settings.fields.report.atmosphere),
      atmosphereDetails: yup
        .string()
        .nullable()
        .when(["cancelled", "atmosphere"], (cancelled, atmosphere, schema) =>
          cancelled
            ? schema.nullable()
            : atmosphere === Report.ATMOSPHERE.POSITIVE
              ? schema.nullable()
              : schema.required(
                `You must provide ${
                  Settings.fields.report.atmosphereDetails
                } if the engagement was not Positive`
              )
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
      principalOrg: yup
        .object()
        .nullable()
        .default({}),
      advisorOrg: yup
        .object()
        .nullable()
        .default({}),
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
                message: `You must provide at least one ${
                  Settings.fields.task.shortLabel
                }`
              })
              : true
          }
        )
        .default([]),
      comments: yup
        .array()
        .nullable()
        .default([]),
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
                    message: `You must provide the ${
                      Settings.fields.report.reportText
                    }`
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
        .required(
          `You must provide a brief summary of the ${
            Settings.fields.report.nextSteps
          }`
        )
        .default("")
        .label(Settings.fields.report.nextSteps),
      keyOutcomes: yup
        .string()
        .nullable()
        .when("cancelled", (cancelled, schema) =>
          cancelled
            ? schema.nullable()
            : schema.required(
              `You must provide a brief summary of the ${
                Settings.fields.report.keyOutcomes
              }`
            )
        )
        .default("")
        .label(Settings.fields.report.keyOutcomes),
      tags: yup
        .array()
        .nullable()
        .default([]),
      reportTags: yup
        .array()
        .nullable()
        .default([])
        .label(Settings.fields.report.reportTags),
      reportSensitiveInformation: yup
        .object()
        .nullable()
        .default({}), // null?
      authorizationGroups: yup
        .array()
        .nullable()
        .default([])
    })
    .concat(Model.yupSchema)

  static yupWarningSchema = yup.object().shape({
    reportSensitiveInformation: yup
      .object()
      .nullable()
      .default({}),
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

  static isFuture(state) {
    return state === Report.STATE.FUTURE
  }

  isFuture() {
    return Report.isFuture(this.state)
  }

  static isApproved(state) {
    return state === Report.STATE.APPROVED
  }

  isApproved() {
    return Report.isApproved(this.state)
  }

  showWorkflow() {
    return this.state && !this.isDraft() && !this.isFuture()
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
      return `The primary ${roleName} - ${
        primaryAttendee.name
      } - needs to have an active profile`
    } else if (
      primaryAttendee.endOfTourDate &&
      moment(primaryAttendee.endOfTourDate).isBefore(moment().startOf("day"))
    ) {
      return `The primary ${roleName}'s - ${
        primaryAttendee.name
      } - end of tour date has passed`
    } else if (!primaryAttendee.position) {
      return `The primary ${roleName} - ${
        primaryAttendee.name
      } - needs to be assigned to a position`
    } else if (primaryAttendee.position.status !== Position.STATUS.ACTIVE) {
      return `The primary ${roleName} - ${
        primaryAttendee.name
      } - needs to be in an active position`
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
}
