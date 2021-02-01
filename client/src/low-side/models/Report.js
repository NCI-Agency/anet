import _forEach from "lodash/forEach"
import utils from "low-side/utils"
import * as yup from "yup"

class Report {
  static STATES = {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED"
  }

  static EVENT_HEADLINES = {
    DOMAIN: "Domain",
    FACTOR: "Factor"
  }

  static eventHeadlines = Object.values(Report.EVENT_HEADLINES)

  static yupSchema = yup.object().shape({
    uuid: yup.string(),
    state: yup
      .string()
      .oneOf([...Object.values(Report.STATES)])
      .default(Report.STATES.DRAFT),
    reportingTeam: yup
      .string()
      .nullable()
      .required("You must provide the Reporting Team")
      .default("")
      .label("Reporting Team"),
    location: yup
      .string()
      .nullable()
      .required("You must provide a location")
      .label("Location")
      .default(""),
    grid: yup
      .string()
      .nullable()
      .required("You must provide the Grid")
      .default("")
      .label("Grid"),
    dtg: yup
      .string()
      .nullable()
      .required("You must provide the DTG")
      .default("")
      .label("DTG"),
    eventHeadline: yup
      .string()
      .nullable()
      .required("You must provide an Event Headline")
      .default("Domain")
      .label("Event Headline"),
    domain: yup
      .array()
      .nullable()
      .when("eventHeadline", (eventHeadline, schema) => {
        return eventHeadline === Report.EVENT_HEADLINES.DOMAIN
          ? schema.test(
            "domain-maxed",
            "You can provide at most 2 domains",
            val => val.length < 3
          )
          : schema
      })
      .default([])
      .label("Domain"),
    factor: yup
      .array()
      .nullable()
      .when("eventHeadline", (eventHeadline, schema) => {
        return eventHeadline === Report.EVENT_HEADLINES.FACTOR
          ? schema.test(
            "factor-maxed",
            "You can provide at most 2 factors",
            val => val.length < 3
          )
          : schema
      })
      .default([])
      .label("Factor"),
    topics: yup
      .string()
      .nullable()
      .required("You must provide the Topics")
      .default("")
      .label("Topics"),
    contacts: yup
      .string()
      .nullable()
      .required("You must provide the Contacts")
      .default("")
      .label("Reporting Team"),
    description: yup
      .string()
      .nullable()
      .required("You must provide the Description")
      .default("")
      .label("Description"),
    attitude: yup.string().nullable().default("").label("Attitude/behavior"),
    comments: yup.string().nullable().default("").label("LMT Comments"),
    recommendations: yup
      .string()
      .nullable()
      .default("")
      .label("RC TEC assessment and recommendations")
  })

  static isDraft(report) {
    return report.state === Report.STATES.DRAFT
  }

  static fillObject(props, yupSchema) {
    try {
      const obj = yupSchema.cast(props)
      _forEach(yupSchema.fields, (value, key) => {
        if (
          !Object.prototype.hasOwnProperty.call(obj, key) ||
          utils.isNullOrUndefined(obj[key])
        ) {
          obj[key] = value.getDefault()
        }
      })
      return obj
    } catch (e) {
      console.log("Coercion exception:", e)
      throw e
    }
  }

  static pathForEdit(instance) {
    const url = this.pathFor(instance) + "/edit"
    return url
  }

  static pathFor(instance) {
    if (!instance) {
      return console.error(
        `You didn't pass anything to ${this.name}.pathFor. If you want a new route, you can pass null.`
      )
    }

    const uuid = instance.uuid
    const url = ["", "reports", uuid].join("/")
    return url
  }

  constructor(props) {
    const filledProps = Report.fillObject(props, Report.yupSchema)
    Object.forEach(filledProps, (key, value) => {
      this[key] = value
    })
  }

  isDraft() {
    return this.state === Report.STATES.DRAFT
  }

  isSubmitted() {
    return !this.isDraft()
  }
}
export default Report
