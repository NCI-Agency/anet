import Model, {
  createCustomFieldsSchema,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"

export default class Organization extends Model {
  static resourceName = "Organization"
  static listName = "organizationList"
  static getInstanceName = "organization"
  static relatedObjectType = "organizations"

  static APPROVAL_STEP_TYPE = {
    PLANNING_APPROVAL: "PLANNING_APPROVAL",
    REPORT_APPROVAL: "REPORT_APPROVAL"
  }

  static assessmentDictionaryPath = "fields.organization.assessments"
  static assessmentConfig = Settings.fields.organization.assessments

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(
    Settings.fields.organization.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      shortName: yup
        .string()
        .required()
        .default("")
        .label(Settings.fields.organization.shortName?.label),
      longName: yup.string().nullable().default(""),
      status: yup
        .string()
        .required()
        .default(() => Model.STATUS.ACTIVE),
      identificationCode: yup.string().nullable().default(""),
      location: yup
        .object()
        .nullable()
        .default(null)
        .label(Settings.fields.organization.location?.label),
      parentOrg: yup
        .object()
        .nullable()
        .default({})
        .label(Settings.fields.organization.parentOrg?.label),
      childrenOrgs: yup.array().nullable().default([]),
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
              .default(() => Organization.APPROVAL_STEP_TYPE.PLANNING_APPROVAL),
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
              .default(() => Organization.APPROVAL_STEP_TYPE.REPORT_APPROVAL),
            approvers: yup
              .array()
              .required()
              .min(1, "You must select at least one approver")
              .default([])
          })
        )
        .nullable()
        .default([]),
      positions: yup.array().nullable().default([]),
      tasks: yup.array().nullable().default([]),
      profile: yup.string().nullable().default("")
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Organization.customFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery = "uuid shortName longName identificationCode"

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  static isTaskEnabled(shortName) {
    return !Settings.tasking_ORGs || Settings.tasking_ORGs.includes(shortName)
  }

  constructor(props) {
    super(Model.fillObject(props, Organization.yupSchema))
  }

  getAssessmentDictionaryPath() {
    return Organization.assessmentDictionaryPath
  }

  getAssessmentsConfig() {
    return Organization.assessmentConfig
  }

  isTaskEnabled() {
    return Organization.isTaskEnabled(this.shortName)
  }

  iconUrl() {
    return ORGANIZATIONS_ICON
  }

  toString() {
    return [
      this.shortName,
      this.longName,
      !Settings.fields.organization.identificationCode?.exclude &&
        this.identificationCode
    ]
      .filter(Boolean)
      .join(" | ")
  }

  static FILTERED_CLIENT_SIDE_FIELDS = [
    "childrenOrgs",
    "ascendantOrgs",
    "descendantOrgs",
    "positions",
    "tasks"
  ]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Organization.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Organization.filterClientSideFields(this, ...additionalFields)
  }
}
