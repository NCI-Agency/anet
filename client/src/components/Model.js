import encodeQuery from "querystring/encode"
import API from "api"
import { gql } from "apollo-boost"
import _forEach from "lodash/forEach"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import moment from "moment"
import PropTypes from "prop-types"
import utils from "utils"
import * as yup from "yup"

export const GRAPHQL_NOTE_FIELDS = /* GraphQL */ `
  uuid
  createdAt
  updatedAt
  type
  text
  author {
    uuid
    name
    rank
    role
  }
  noteRelatedObjects {
    noteUuid
    relatedObjectType
    relatedObjectUuid
  }
`
export const GRAPHQL_NOTES_FIELDS = /* GraphQL */ `
  notes {
    ${GRAPHQL_NOTE_FIELDS}
  }
`

export const GQL_CREATE_NOTE = gql`
  mutation($note: NoteInput!) {
    createNote(note: $note) {
      ${GRAPHQL_NOTE_FIELDS}
    }
  }
`
export const GQL_UPDATE_NOTE = gql`
  mutation($note: NoteInput!) {
    updateNote(note: $note) {
      ${GRAPHQL_NOTE_FIELDS}
    }
  }
`

export const NOTE_TYPE = {
  FREE_TEXT: "FREE_TEXT",
  CHANGE_RECORD: "CHANGE_RECORD",
  PARTNER_ASSESSMENT: "PARTNER_ASSESSMENT",
  ASSESSMENT: "ASSESSMENT"
}

export const DEFAULT_CUSTOM_FIELDS_PARENT = "formCustomFields"
export const INVISIBLE_CUSTOM_FIELDS_FIELD = "invisibleCustomFields"

export const ASSESSMENTS_RECURRENCE_TYPE = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  SEMIMONTHLY: "semimonthly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  SEMIANNUALY: "semiannualy"
}
export const ASSESSMENTS_RELATED_OBJECT_TYPE = {
  REPORT: "report"
}

export const yupDate = yup.date().transform(function(value, originalValue) {
  if (this.isType(value)) {
    return value
  }
  const newValue = moment(originalValue)
  return newValue.isValid() ? newValue.toDate() : value
})

export const CUSTOM_FIELD_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  DATETIME: "datetime",
  ENUM: "enum",
  ENUMSET: "enumset",
  ARRAY_OF_OBJECTS: "array_of_objects",
  SPECIAL_FIELD: "special_field"
}

const CUSTOM_FIELD_TYPE_SCHEMA = {
  [CUSTOM_FIELD_TYPE.TEXT]: yup.string().nullable().default(""),
  [CUSTOM_FIELD_TYPE.NUMBER]: yup.number().nullable().default(null),
  [CUSTOM_FIELD_TYPE.DATE]: yupDate.nullable().default(null),
  [CUSTOM_FIELD_TYPE.DATETIME]: yupDate.nullable().default(null),
  [CUSTOM_FIELD_TYPE.ENUM]: yup.string().nullable().default(""),
  [CUSTOM_FIELD_TYPE.ENUMSET]: yup.array().nullable().default([]),
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: yup.array().nullable().default([]),
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: yup.mixed().nullable().default(null)
}

const createFieldYupSchema = (fieldKey, fieldConfig, parentFieldName) => {
  const { label, validations, objectFields, typeError } = fieldConfig
  let fieldTypeYupSchema = CUSTOM_FIELD_TYPE_SCHEMA[fieldConfig.type]
  if (typeError) {
    fieldTypeYupSchema = fieldTypeYupSchema.typeError(typeError)
  }
  if (!_isEmpty(objectFields)) {
    const objSchema = createYupObjectShape(objectFields, parentFieldName)
    fieldTypeYupSchema = fieldTypeYupSchema.of(objSchema)
  }
  if (!_isEmpty(validations)) {
    validations.forEach(validation => {
      const { params, type } = validation
      if (!fieldTypeYupSchema[type]) {
        return
      }
      fieldTypeYupSchema = !_isEmpty(params)
        ? fieldTypeYupSchema[type](...params)
        : fieldTypeYupSchema[type]()
    })
  }

  let fieldYupSchema = yup.mixed().nullable().default(null)
  if (!_isEmpty(label)) {
    fieldYupSchema = fieldYupSchema.label(label)
  }
  // Field type specific validation not needed when the field is invisible or
  // when INVISIBLE_CUSTOM_FIELDS_FIELD hasn't even been filled (like when the report
  // has been created via sevrer side tests, or later maybe imported from an
  // external system (and never went through the edit/create form which normally
  // fills the INVISIBLE_CUSTOM_FIELDS_FIELD)
  fieldYupSchema = fieldYupSchema.when(
    INVISIBLE_CUSTOM_FIELDS_FIELD,
    (invisibleCustomFields, schema) => {
      return invisibleCustomFields === null ||
        (invisibleCustomFields &&
          invisibleCustomFields.includes(`${parentFieldName}.${fieldKey}`))
        ? schema
        : schema.concat(fieldTypeYupSchema)
    }
  )
  return fieldYupSchema
}

export const createYupObjectShape = (
  config,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT
) => {
  let objShape = {}
  if (config) {
    objShape = Object.fromEntries(
      Object.entries(config)
        .map(([k, v]) => [
          k,
          createFieldYupSchema(k, config[k], parentFieldName)
        ])
        .filter(([k, v]) => v !== null)
    )
    objShape[INVISIBLE_CUSTOM_FIELDS_FIELD] = yup
      .mixed()
      .nullable()
      .default(null)
  }
  return yup.object().shape(objShape)
}

export const ENTITY_ASSESSMENT_PARENT_FIELD = "entityAssessment"

export const createAssessmentSchema = (
  assessmentConfig,
  parentFieldName = ENTITY_ASSESSMENT_PARENT_FIELD
) => {
  const assessmentSchemaShape = createYupObjectShape(
    assessmentConfig,
    parentFieldName
  )
  return yup.object().shape({
    [parentFieldName]: assessmentSchemaShape
  })
}

export const createCustomFieldsSchema = customFieldsConfig =>
  yup.object().shape({
    [DEFAULT_CUSTOM_FIELDS_PARENT]: createYupObjectShape(
      customFieldsConfig
    ).nullable()
  })

export default class Model {
  static schema = {
    notes: []
  }

  static yupSchema = yup.object().shape({
    notes: yup.array().nullable().default([])
  })

  static fillObject(props, yupSchema) {
    try {
      const obj = yupSchema.cast(props)
      _forEach(yupSchema.fields, (value, key) => {
        if (
          !Object.prototype.hasOwnProperty.call(obj, key) ||
          obj[key] === null ||
          obj[key] === undefined
        ) {
          obj[key] = value.default()
        }
      })
      return obj
    } catch (e) {
      console.log("Coercion exception:", e)
      throw e
    }
  }

  static notePropTypes = PropTypes.shape({
    uuid: PropTypes.string,
    createdAt: PropTypes.number,
    text: PropTypes.string,
    author: PropTypes.shape({
      uuid: PropTypes.string,
      name: PropTypes.string,
      rank: PropTypes.string,
      role: PropTypes.string
    }),
    noteRelatedObjects: PropTypes.arrayOf(
      PropTypes.shape({
        noteUuid: PropTypes.string,
        relatedObjectType: PropTypes.string,
        relatedObjectUuid: PropTypes.string
      })
    )
  })

  static resourceName = null
  static displayName(appSettings) {
    return null
  }

  static listName = null

  static fromArray(array) {
    if (!array) return []

    return array.map(object =>
      object instanceof this ? object : new this(object)
    )
  }

  static map(array, func) {
    if (!array) return []

    return array.map((object, idx) =>
      object instanceof this ? func(object, idx) : func(new this(object), idx)
    )
  }

  static pathFor(instance, query) {
    if (!instance) {
      return console.error(
        `You didn't pass anything to ${this.name}.pathFor. If you want a new route, you can pass null.`
      )
    }

    if (process.env.NODE_ENV !== "production") {
      if (!this.resourceName) {
        return console.error(
          `You must specify a resourceName on model ${this.name}.`
        )
      }
    }

    const resourceName = utils.resourceize(this.resourceName)
    const uuid = instance.uuid
    let url = ["", resourceName, uuid].join("/")

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

  static pathForNew(query) {
    const resourceName = utils.resourceize(this.resourceName)
    let url = ["", resourceName, "new"].join("/")

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

  static pathForEdit(instance, query) {
    let url = this.pathFor(instance) + "/edit"

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

  static isEqual(a, b) {
    return a && b && a.uuid === b.uuid
  }

  static fetchByUuid(uuid, ENTITY_GQL_FIELDS) {
    const fields = ENTITY_GQL_FIELDS[this.resourceName]
    if (!fields) {
      return null
    }

    return API.query(
      gql`
      query($uuid: String!) {
        ${this.getInstanceName}(uuid: $uuid) {
          ${fields}
        }
      }
    `,
      {
        uuid: uuid
      }
    ).then(data => new Models[this.resourceName](data[this.getInstanceName]))
  }

  constructor(props) {
    Object.forEach(this.constructor.schema, (key, value) => {
      if (Array.isArray(value) && value.length === 0) {
        this[key] = []
      } else if (
        value &&
        typeof value === "object" &&
        Object.keys(value).length === 0
      ) {
        this[key] = {}
      } else {
        this[key] = value
      }
    })

    if (props) {
      this.setState(props)
    }
  }

  setState(props) {
    Object.forEach(props, (key, value) => {
      this[key] = value
    })

    return this
  }

  iconUrl() {
    return ""
  }

  toPath(query) {
    return this.uuid
      ? this.constructor.pathFor(this, query)
      : this.constructor.pathForNew(query)
  }

  toString() {
    return this.name || this.uuid
  }

  static parseAssessmentsConfig(assessmentsConfig) {
    return Object.fromEntries(
      assessmentsConfig.map(a => {
        const recurrence = a.recurrence || ASSESSMENTS_RECURRENCE_TYPE.ONCE
        const assessmentKey = a.relatedObjectType
          ? `${a.relatedObjectType}_${recurrence}`
          : recurrence
        const questions = a.questions || {}
        return [
          assessmentKey,
          typeof questions === "object"
            ? questions
            : typeof questions === "string"
              ? JSON.parse(questions)
              : {}
        ]
      })
    )
  }

  generalAssessmentsConfig() {
    // assessments configuration defined for more than one instance
    return []
  }

  instanceAssessmentsConfig() {
    // assessments configuration defined for one specific instance
    return []
  }

  getAssessmentsConfig() {
    return Object.assign(
      Model.parseAssessmentsConfig(this.generalAssessmentsConfig()),
      Model.parseAssessmentsConfig(this.instanceAssessmentsConfig())
    )
  }

  getInstantAssessmentConfig(
    relatedObjectType = ASSESSMENTS_RELATED_OBJECT_TYPE.REPORT
  ) {
    return this.getAssessmentsConfig()[
      `${relatedObjectType}_${ASSESSMENTS_RECURRENCE_TYPE.ONCE}`
    ]
  }

  getPeriodicAssessmentDetails(
    recurrence = ASSESSMENTS_RECURRENCE_TYPE.MONTHLY
  ) {
    const assessmentConfig = this.getAssessmentsConfig()[recurrence]
    return {
      assessmentConfig: assessmentConfig,
      assessmentYupSchema:
        assessmentConfig && createAssessmentSchema(assessmentConfig)
    }
  }

  getPeriodAssessments(recurrence, period, currentUser) {
    return this.notes
      .filter(n => {
        return (
          n.type === NOTE_TYPE.ASSESSMENT && n.noteRelatedObjects.length === 1
        )
      })
      .sort((a, b) => b.createdAt - a.createdAt) // desc sorted
      .map(note => ({ note: note, assessment: JSON.parse(note.text) }))
      .filter(
        obj =>
          // FIXME: make a nicer implementation of the check on period start
          obj.assessment.__recurrence === recurrence &&
          obj.assessment.__periodStart ===
            JSON.parse(JSON.stringify(period.start))
      )
  }

  static getInstantAssessmentsDetailsForEntities(
    entities,
    assessmentsParentField
  ) {
    const assessmentsConfig = {}
    const assessmentsSchemaShape = {}
    entities.forEach(entity => {
      assessmentsConfig[entity.uuid] = entity.getInstantAssessmentConfig()
      if (!_isEmpty(assessmentsConfig[entity.uuid])) {
        assessmentsSchemaShape[entity.uuid] = createYupObjectShape(
          assessmentsConfig[entity.uuid],
          `${assessmentsParentField}.${entity.uuid}`
        )
      }
    })
    return {
      assessmentsConfig: assessmentsConfig,
      assessmentsSchema: yup.object().shape({
        [assessmentsParentField]: yup
          .object()
          .shape(assessmentsSchemaShape)
          .nullable()
          .default(null)
      })
    }
  }

  getInstantAssessmentResults(
    dateRange,
    relatedObjectType = ASSESSMENTS_RELATED_OBJECT_TYPE.REPORT
  ) {
    // FIXME: don't retrieve the published reports but also return the note's
    // relatedObject and filter on its status
    const publishedReports = this.publishedReports
    const publishedReportsUuids = publishedReports
      ? publishedReports.map(r => r.uuid)
      : undefined
    const assessmentsNotes = this.notes
      .filter(
        n =>
          n.type === NOTE_TYPE.ASSESSMENT &&
          n.noteRelatedObjects.filter(
            ro =>
              ro.relatedObjectType === Models.Report.relatedObjectType &&
              (publishedReportsUuids !== undefined
                ? publishedReportsUuids.includes(ro.relatedObjectUuid)
                : true)
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
