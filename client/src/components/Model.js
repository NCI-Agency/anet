import { gql } from "@apollo/client"
import API from "api"
import { JSONPath } from "jsonpath-plus"
import _forEach from "lodash/forEach"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import {
  dateBelongsToPeriod,
  PERIOD_FACTORIES,
  RECURRENCE_TYPE
} from "periodUtils"
import PropTypes from "prop-types"
import encodeQuery from "querystring/encode"
import utils from "utils"
import * as yup from "yup"

// These two are needed here although they are Report specific;
// export these separately to avoid circular import problems
export const REPORT_RELATED_OBJECT_TYPE = "reports"
export const REPORT_STATE_PUBLISHED = "PUBLISHED"

export const GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS = /* GraphQL */ `
  customSensitiveInformation {
    uuid
    customFieldName
    customFieldValue
  }
`

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
    relatedObject {
      ... on AuthorizationGroup {
        name
      }
      ... on Location {
        name
      }
      ... on Organization {
        shortName
      }
      ... on Person {
        role
        rank
        name
        avatar(size: 32)
      }
      ... on Position {
        type
        name
      }
      ... on Report {
        intent
        engagementDate
        state
      }
      ... on Task {
        shortName
        longName
      }
    }
  }
`
export const GRAPHQL_NOTES_FIELDS = /* GraphQL */ `
  notes {
    ${GRAPHQL_NOTE_FIELDS}
  }
`

// Entity type --> GQL query
export const GRAPHQL_ENTITY_FIELDS = {
  Report: "uuid intent",
  Person: "uuid name role avatar(size: 32)",
  Organization: "uuid shortName",
  Position: "uuid name",
  Location: "uuid name",
  Task: "uuid shortName longName"
}

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

export const MODEL_TO_OBJECT_TYPE = {
  AuthorizationGroup: "authorizationGroups",
  Location: "locations",
  Organization: "organizations",
  Person: "people",
  Position: "positions",
  Report: "reports",
  Task: "tasks"
}
export const OBJECT_TYPE_TO_MODEL = {}
Object.entries(MODEL_TO_OBJECT_TYPE).forEach(([k, v]) => {
  OBJECT_TYPE_TO_MODEL[v] = k
})

export const NOTE_TYPE = {
  FREE_TEXT: "FREE_TEXT",
  CHANGE_RECORD: "CHANGE_RECORD",
  PARTNER_ASSESSMENT: "PARTNER_ASSESSMENT",
  ASSESSMENT: "ASSESSMENT"
}

export const DEFAULT_CUSTOM_FIELDS_PARENT = "formCustomFields"
export const SENSITIVE_CUSTOM_FIELDS_PARENT = "formSensitiveFields"
export const INVISIBLE_CUSTOM_FIELDS_FIELD = "invisibleCustomFields"
export const NOTES_FIELD = "notes"
export const IS_SUBSCRIBED_FIELD = "isSubscribed"

export const ASSESSMENTS_RELATED_OBJECT_TYPE = {
  REPORT: "report"
}

export const yupDate = yup.date().transform(function(value, originalValue) {
  if (
    this.isType(value) &&
    (this.isType(originalValue)
      ? value === originalValue
      : value.getTime() === originalValue)
  ) {
    return value
  }
  const newValue = moment(originalValue)
  return newValue.isValid() ? newValue.toDate() : null
})

export const CUSTOM_FIELD_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  DATETIME: "datetime",
  JSON: "json",
  ENUM: "enum",
  ENUMSET: "enumset",
  ARRAY_OF_OBJECTS: "array_of_objects",
  SPECIAL_FIELD: "special_field",
  ANET_OBJECT: "anet_object",
  ARRAY_OF_ANET_OBJECTS: "array_of_anet_objects"
}

export const CUSTOM_FIELD_TYPE_DEFAULTS = {
  [CUSTOM_FIELD_TYPE.TEXT]: "",
  [CUSTOM_FIELD_TYPE.NUMBER]: null,
  [CUSTOM_FIELD_TYPE.DATE]: null,
  [CUSTOM_FIELD_TYPE.DATETIME]: null,
  [CUSTOM_FIELD_TYPE.JSON]: null,
  [CUSTOM_FIELD_TYPE.ENUM]: "",
  [CUSTOM_FIELD_TYPE.ENUMSET]: [],
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: [],
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: null,
  [CUSTOM_FIELD_TYPE.ANET_OBJECT]: null,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]: []
}

const CUSTOM_FIELD_TYPE_SCHEMA = {
  [CUSTOM_FIELD_TYPE.TEXT]: yup
    .string()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.TEXT]),
  [CUSTOM_FIELD_TYPE.NUMBER]: yup
    .number()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.NUMBER])
    .typeError(
      // eslint-disable-next-line no-template-curly-in-string
      "${path} must be a ${type} type, but the final value was ${originalValue}"
    ),
  [CUSTOM_FIELD_TYPE.DATE]: yupDate
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.DATE]),
  [CUSTOM_FIELD_TYPE.DATETIME]: yupDate
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.DATETIME]),
  [CUSTOM_FIELD_TYPE.JSON]: yup
    .mixed()
    .nullable()
    .test(
      "json",
      "json error",
      // can't use arrow function here because of binding to 'this'
      function(value) {
        return typeof value === "object"
          ? true
          : this.createError({ message: "Invalid JSON" })
      }
    )
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.JSON]),
  [CUSTOM_FIELD_TYPE.ENUM]: yup
    .string()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.ENUM]),
  [CUSTOM_FIELD_TYPE.ENUMSET]: yup
    .array()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.ENUMSET]),
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: yup
    .array()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]),
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: yup
    .mixed()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.SPECIAL_FIELD]),
  [CUSTOM_FIELD_TYPE.ANET_OBJECT]: yup
    .mixed()
    .nullable()
    .default(CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.ANET_OBJECT]),
  [CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]: yup
    .array()
    .nullable()
    .default(
      CUSTOM_FIELD_TYPE_DEFAULTS[CUSTOM_FIELD_TYPE.ARRAY_OF_ANET_OBJECTS]
    )
}

const createFieldYupSchema = (fieldKey, fieldConfig, parentFieldName) => {
  const { label, validations, objectFields, typeError } = fieldConfig
  let fieldTypeYupSchema = CUSTOM_FIELD_TYPE_SCHEMA[fieldConfig.type]
  if (typeError) {
    fieldTypeYupSchema = fieldTypeYupSchema.typeError(typeError)
  }
  if (!_isEmpty(objectFields)) {
    const objSchema = createYupObjectShape(objectFields, parentFieldName, false)
    fieldTypeYupSchema = fieldTypeYupSchema.of(objSchema)
  }
  if (!_isEmpty(validations)) {
    validations.forEach(validation => {
      const { params, type } = validation
      if (fieldConfig.widget === "richTextEditor" && type === "required") {
        // Empty html like <p></p> must be invalid if the richTextEditor field is required
        fieldTypeYupSchema = fieldTypeYupSchema.test(
          "rte-required",
          "rte-required-error",
          function(htmlString) {
            return utils.isEmptyHtml(htmlString)
              ? this.createError({
                message: params?.[0] || ""
              })
              : true
          }
        )
      }
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
  // Field type specific validation not needed when the field is invisible
  fieldYupSchema = fieldYupSchema.when(
    INVISIBLE_CUSTOM_FIELDS_FIELD,
    (invisibleCustomFields, schema) =>
      invisibleCustomFields &&
      invisibleCustomFields.includes(`${parentFieldName}.${fieldKey}`)
        ? schema
        : schema.concat(fieldTypeYupSchema)
  )
  return fieldYupSchema
}

export const createYupObjectShape = (
  config,
  parentFieldName = DEFAULT_CUSTOM_FIELDS_PARENT,
  isTopLevel = true
) => {
  let objShape = {}
  if (config) {
    objShape = Object.fromEntries(
      Object.entries(config)
        .map(([k, v]) => [k, createFieldYupSchema(k, v, parentFieldName)])
        .filter(([k, v]) => v !== null)
    )
    // only the top level config objects keep hold of the invisible fields info
    if (isTopLevel) {
      objShape[INVISIBLE_CUSTOM_FIELDS_FIELD] = yup
        .mixed()
        .nullable()
        .default(null)
    }
  }
  return yup.object().shape(objShape)
}

export const ENTITY_ASSESSMENT_PARENT_FIELD = "entityAssessment"
export const ENTITY_ON_DEMAND_ASSESSMENT_DATE = "assessmentDate"
export const ENTITY_ON_DEMAND_EXPIRATION_DATE = "expirationDate"

export const createAssessmentSchema = (
  assessmentConfig,
  parentFieldName = ENTITY_ASSESSMENT_PARENT_FIELD
) => {
  let assessmentSchemaShape = createYupObjectShape(
    assessmentConfig.questions,
    parentFieldName
  )

  /** *********** Additional validation section for specific assessment fields. *************/
  if (assessmentSchemaShape.fields.expirationDate) {
    assessmentSchemaShape.fields.expirationDate = assessmentSchemaShape.fields.expirationDate.when(
      ENTITY_ON_DEMAND_ASSESSMENT_DATE,
      (assessmentDate, schema) => {
        if (assessmentDate) {
          return schema.min(
            assessmentDate,
            `${
              assessmentConfig.expirationDate.label
            } must be later than ${moment(assessmentDate).format("DD-MM-YYYY")}`
          )
        }
      }
    )
  }
  /******************************************************************************************/

  if (!_isEmpty(assessmentConfig.questionSets)) {
    const questionSetsSchema = {}
    Object.entries(assessmentConfig.questionSets).forEach(([k, v]) => {
      if (v?.questions) {
        const qsParentFieldName = `${parentFieldName}.questionSets.${k}.questions`
        questionSetsSchema[k] = yup.object().shape({
          questions: createYupObjectShape(v.questions, qsParentFieldName)
        })
      }
    })
    assessmentSchemaShape = assessmentSchemaShape.concat(
      yup.object().shape({
        questionSets: yup.object().shape(questionSetsSchema)
      })
    )
  }

  return yup.object().shape({
    [parentFieldName]: assessmentSchemaShape
  })
}

export const createCustomFieldsSchema = (
  customFieldsConfig,
  customFieldsParent = DEFAULT_CUSTOM_FIELDS_PARENT
) =>
  yup.object().shape({
    [customFieldsParent]: createYupObjectShape(
      customFieldsConfig,
      customFieldsParent
    ).nullable()
  })

export default class Model {
  static schema = {
    notes: []
  }

  static STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
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

  static relatedObjectPropType = PropTypes.shape({
    noteUuid: PropTypes.string,
    relatedObjectType: PropTypes.string.isRequired,
    relatedObjectUuid: PropTypes.string.isRequired,
    relatedObject: PropTypes.object
  })

  static noteRelatedObjectsPropType = PropTypes.arrayOf(
    Model.relatedObjectPropType
  )

  static notePropType = PropTypes.shape({
    uuid: PropTypes.string,
    createdAt: PropTypes.number,
    text: PropTypes.string,
    author: PropTypes.shape({
      uuid: PropTypes.string,
      name: PropTypes.string,
      rank: PropTypes.string,
      role: PropTypes.string
    }),
    noteRelatedObjects: Model.noteRelatedObjectsPropType
  })

  static resourceName = null
  static displayName(appSettings) {
    return null
  }

  static listName = null

  static fromArray(array) {
    if (!array) {
      return []
    }

    return array.map(object =>
      object instanceof this ? object : new this(object)
    )
  }

  static map(array, func) {
    if (!array) {
      return []
    }

    return array.map((object, idx) =>
      object instanceof this ? func(object, idx) : func(new this(object), idx)
    )
  }

  static pathFor(instance, query, resourceOverride) {
    if (!instance) {
      return console.error(
        `You didn't pass anything to ${this.name}.pathFor. If you want a new route, you can pass null.`
      )
    }

    if (process.env.NODE_ENV !== "production") {
      if (!resourceOverride && !this.resourceName) {
        return console.error(
          `You must specify a resourceName on model ${this.name}.`
        )
      }
    }

    const resourceName = utils.resourceize(this.resourceName)
    const uuid = instance.uuid
    let url = ["", resourceOverride || resourceName, uuid].join("/")

    if (query) {
      url += "?" + encodeQuery(query)
    }

    return url
  }

  static pathForNew(query, resourceOverride) {
    const resourceName = utils.resourceize(this.resourceName)
    let url = ["", resourceOverride || resourceName, "new"].join("/")

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

  static fetchByUuid(uuid, entityGqlFields) {
    const fields = entityGqlFields[this.resourceName]
    if (!fields) {
      return Promise.resolve(null)
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
    ).then(data => new this(data[this.getInstanceName]))
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
        const recurrence = a.recurrence || RECURRENCE_TYPE.ONCE
        const assessmentKey = a.relatedObjectType
          ? `${a.relatedObjectType}_${recurrence}`
          : recurrence
        const questions = a.questions || {}
        const questionSets = a.questionSets || {}
        return [assessmentKey, { questions, questionSets }]
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
    const general = this.generalAssessmentsConfig()
    const instance = this.instanceAssessmentsConfig()
    return Object.assign(
      Model.parseAssessmentsConfig(general),
      // instance config can override
      Model.parseAssessmentsConfig(instance)
    )
  }

  getInstantAssessmentConfig(
    relatedObjectType = ASSESSMENTS_RELATED_OBJECT_TYPE.REPORT
  ) {
    return this.getAssessmentsConfig()[
      `${relatedObjectType}_${RECURRENCE_TYPE.ONCE}`
    ]
  }

  getPeriodicAssessmentDetails(recurrence = RECURRENCE_TYPE.MONTHLY) {
    const assessmentConfig = this.getAssessmentsConfig()[recurrence]
    return {
      assessmentConfig: assessmentConfig,
      assessmentYupSchema:
        assessmentConfig && createAssessmentSchema(assessmentConfig)
    }
  }

  getPeriodAssessments(recurrence, period) {
    return this.notes
      .filter(n => {
        return (
          n.type === NOTE_TYPE.ASSESSMENT && n.noteRelatedObjects.length === 1
        )
      })
      .sort((a, b) => b.createdAt - a.createdAt) // desc sorted
      .map(note => ({ note: note, assessment: utils.parseJsonSafe(note.text) }))
      .filter(
        obj =>
          obj.assessment.__recurrence === recurrence &&
          dateBelongsToPeriod(obj.assessment.__periodStart, period)
      )
  }

  /**
   * Filters ondemand assessments inside the notes object and returns them sorted
   * with respect to their assessmentDate.
   * @returns {object}
   */
  getOndemandAssessments() {
    const onDemandNotes = this.notes.filter(
      a =>
        a.type === "ASSESSMENT" &&
        utils.parseJsonSafe(a.text).__recurrence === RECURRENCE_TYPE.ON_DEMAND
    )
    // Sort the notes before visualizing them inside of a Card.
    const sortedOnDemandNotes = onDemandNotes.sort((a, b) => {
      return (
        new Date(
          utils.parseJsonSafe(a.text)[ENTITY_ON_DEMAND_ASSESSMENT_DATE]
        ) -
        new Date(utils.parseJsonSafe(b.text)[ENTITY_ON_DEMAND_ASSESSMENT_DATE])
      )
    })
    return sortedOnDemandNotes
  }

  static getInstantAssessmentsDetailsForEntities(
    entities,
    assessmentsParentField,
    relatedObject
  ) {
    const assessmentsConfig = {}
    const assessmentsSchemaShape = {}
    entities?.forEach(entity => {
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
    return this.notes
      .filter(
        n =>
          n.type === NOTE_TYPE.ASSESSMENT &&
          n.noteRelatedObjects.filter(
            ro =>
              ro.relatedObject &&
              ro.relatedObjectType === REPORT_RELATED_OBJECT_TYPE &&
              ro.relatedObject.state === REPORT_STATE_PUBLISHED &&
              (!dateRange ||
                (ro.relatedObject.engagementDate <= dateRange.end &&
                  ro.relatedObject.engagementDate >= dateRange.start))
          ).length
      )
      .map(note => utils.parseJsonSafe(note.text))
      .filter(
        obj =>
          obj.__recurrence === RECURRENCE_TYPE.ONCE &&
          obj.__relatedObjectType === relatedObjectType
      )
  }

  static hasPendingAssessments(entity) {
    const recurTypes = Object.keys(entity.getAssessmentsConfig())
    const periodicRecurTypes = recurTypes.filter(type => PERIOD_FACTORIES[type])
    if (_isEmpty(periodicRecurTypes)) {
      // no periodic, no pending
      return false
    }

    // "for loop" to break early
    for (let i = 0; i < periodicRecurTypes.length; i++) {
      // offset 1 so that the period is the previous (not current) period
      const prevPeriod = PERIOD_FACTORIES[periodicRecurTypes[i]](moment(), 1)
      const prevPeriodAssessments = entity.getPeriodAssessments(
        periodicRecurTypes[i],
        prevPeriod
      )
      // if there is no assessment in the last period, we have pending assessment
      if (prevPeriodAssessments.length === 0) {
        return true
      }
    }
    // if we didn't early return, there is no pending assessment
    return false
  }

  static filterAssessmentConfig(assessmentConfig, subject, relatedObject) {
    const testValue = { subject, relatedObject }
    const filteredAssessmentConfig = { questions: {}, questionSets: {} }
    if (!_isEmpty(assessmentConfig?.questions)) {
      Object.entries(assessmentConfig.questions)
        .filter(
          ([key, question]) =>
            !question.test ||
            !_isEmpty(JSONPath({ path: question.test, json: testValue }))
        )
        .forEach(([key, question]) => {
          filteredAssessmentConfig.questions[key] = question
        })
    }
    if (!_isEmpty(assessmentConfig?.questionSets)) {
      Object.entries(assessmentConfig.questionSets)
        .filter(
          ([key, questionSet]) =>
            !questionSet.test ||
            !_isEmpty(JSONPath({ path: questionSet.test, json: testValue }))
        )
        .forEach(([key, questionSet]) => {
          filteredAssessmentConfig.questionSets[key] = questionSet
        })
    }
    return filteredAssessmentConfig
  }

  static clearInvalidAssessmentQuestions(
    assessment,
    entity,
    relatedObject,
    assessmentConfig,
    parentField
  ) {
    // Valid questions and questionSets for the current level
    const filtered = Model.filterAssessmentConfig(
      assessmentConfig,
      entity,
      relatedObject
    )
    // Values of questions and questionSets for the current level
    const currentLevelAssessment = parentField
      ? utils.readNestedObjectWithStringPath(assessment, parentField)
      : assessment
    if (!parentField) {
      // Assessment questions are not in the questions object in the top level.
      // Only way to get the questions on the top level is to filter out other fields
      const nonQuestionFields = [
        "__recurrence",
        "__relatedObjectType",
        "invisibleCustomFields",
        "questionSets"
      ]
      const topLevelQuestions = Object.keys(currentLevelAssessment).filter(
        field => !nonQuestionFields.includes(field)
      )
      // Clear invalid questions on the top level
      topLevelQuestions.forEach(
        question =>
          !filtered?.questions?.[question] &&
          delete currentLevelAssessment[question]
      )
    } else {
      // In the deeper levels questions are inside the questions object
      const currentLevelQuestions = Object.keys(
        currentLevelAssessment.questions || {}
      )
      // Clear invalid questions on the current level
      currentLevelQuestions.forEach(
        question =>
          !filtered.questions[question] &&
          delete currentLevelAssessment.questions[question]
      )
    }
    const currentLevelQuestionSets = Object.keys(
      currentLevelAssessment.questionSets || {}
    )
    // Clear questionSets on the current level
    currentLevelQuestionSets.forEach(
      questionSet =>
        !filtered?.questionSets?.[questionSet] &&
        delete currentLevelAssessment.questionSets[questionSet]
    )
    // If there are any valid questionSet left, clear invalid questions and questionSets in these questionSets
    !_isEmpty(currentLevelAssessment.questionSets) &&
      Object.entries(currentLevelAssessment.questionSets).forEach(
        ([questionSet, config]) => {
          // As filterAssessmentConfig only filters one level, we need to pass the current level's assessment config
          const currFiltered = utils.readNestedObjectWithStringPath(
            filtered,
            `questionSets.${questionSet}`
          )
          Model.clearInvalidAssessmentQuestions(
            assessment,
            entity,
            relatedObject,
            currFiltered,
            `${parentField ? `${parentField}.` : ""}questionSets.${questionSet}`
          )
        }
      )
  }

  static populateCustomFields(entity) {
    entity[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      entity.customFields
    )
    Model.populateNotesCustomFields(entity)
  }

  static populateEntitiesNotesCustomFields(entities) {
    entities.forEach(entity => {
      Model.populateNotesCustomFields(entity)
    })
  }

  static populateNotesCustomFields(entity) {
    entity.notes.forEach(
      note =>
        note.type !== NOTE_TYPE.FREE_TEXT &&
        (note.customFields = utils.parseJsonSafe(note.text))
    )
  }

  static FILTERED_CLIENT_SIDE_FIELDS = [
    NOTES_FIELD,
    IS_SUBSCRIBED_FIELD,
    DEFAULT_CUSTOM_FIELDS_PARENT,
    SENSITIVE_CUSTOM_FIELDS_PARENT
  ]

  static filterClientSideFields(obj, ...additionalFields) {
    return Object.without(
      obj,
      ...Model.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Model.filterClientSideFields(this, ...additionalFields)
  }

  static isAuthorized(user, customSensitiveInformationField) {
    // Admins are always allowed
    if (user?.isAdmin()) {
      return true
    }
    // Else user has to be in the authorizationGroups
    const userAuthGroupUuids =
      user?.position?.authorizationGroups.map(ag => ag.uuid) || []
    const fieldAuthGroupUuids =
      customSensitiveInformationField?.authorizationGroupUuids || []
    return fieldAuthGroupUuids.some(uuid => userAuthGroupUuids.includes(uuid))
  }

  static getAuthorizedSensitiveFields(
    isAuthorizedCallback,
    user,
    customSensitiveInformation,
    ...args
  ) {
    const authorizedFieldsConfig = {}
    Object.entries(customSensitiveInformation).forEach(([k, v]) => {
      isAuthorizedCallback(user, customSensitiveInformation[k], ...args) &&
        (authorizedFieldsConfig[k] = v)
    })
    return authorizedFieldsConfig
  }
}
