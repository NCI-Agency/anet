import API from "api"
import Model, {
  createCustomFieldsSchema,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  GRAPHQL_NOTES_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT,
  yupDate,
  yupEmailAddressesWithValidation
} from "components/Model"
import _isEmpty from "lodash/isEmpty"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import utils from "utils"
import * as yup from "yup"
import Position from "./Position"

export default class Person extends Model {
  static resourceName = "Person"
  static listName = "personList"
  static getInstanceName = "person"
  static relatedObjectType = "people"

  static nameDelimiter = ","

  static assessmentDictionaryPath = "fields.regular.person.assessments"

  static assessmentConfig = Settings.fields.regular.person.assessments

  static customFields = Settings.fields.person.customFields

  static customSensitiveInformation =
    Settings.fields.person.customSensitiveInformation || {}

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createCustomFieldsSchema(Person.customFields)
  static sensitiveFieldsSchema = createCustomFieldsSchema(
    Person.customSensitiveInformation,
    SENSITIVE_CUSTOM_FIELDS_PARENT
  )

  static advisorShowPageOrderedFields = Person.initShowPageFieldsOrdered(true)
  static regularShowPageOrderedFields = Person.initShowPageFieldsOrdered(false)

  static yupSchema = yup
    .object()
    .shape({
      uuid: yup.string().nullable().default(null),
      name: yup.string().nullable().default(""),
      // not actually in the database, but used for validation
      firstName: yup
        .string()
        .nullable()
        .when("user", ([user], schema) =>
          !user
            ? schema
            : schema.required(
              `You must provide the ${Settings.fields.person.firstName?.label}`
            )
        )
        .default("")
        .label(Settings.fields.person.firstName?.label),
      // not actually in the database, but used for validation
      lastName: yup
        .string()
        .nullable()
        .uppercase()
        .required(
          `You must provide the ${Settings.fields.person.lastName?.label}`
        )
        .default("")
        .label(Settings.fields.person.lastName?.label),
      user: yup
        .boolean()
        .default(false)
        .label(Settings.fields.person.user?.label),
      domainUsername: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.person.domainUsername?.label),
      emailAddresses: yupEmailAddressesWithValidation(
        "emailAddress",
        "emailAddress error",
        function(address, testContext) {
          const { from } = this
          const user = from[1].value.user
          const r = utils.handleEmailValidation(address, user)
          return Settings.fields.person.emailAddress?.optional || r.isValid
            ? true
            : testContext.createError({ message: r.message })
        }
      ),
      country: yup
        .object()
        .nullable()
        .when([], (_, schema) =>
          Settings.fields.person.country?.optional
            ? schema
            : schema.required(
              `You must provide the ${Settings.fields.person.country?.label}`
            )
        )
        .default(null)
        .label(Settings.fields.person.country?.label),
      rank: yup
        .string()
        .nullable()
        .required(
          `You must provide the ${Settings.fields.person.rank?.label} (Military rank, CIV and CTR values are available)`
        )
        .default("")
        .label(Settings.fields.person.rank?.label),
      avatarUuid: yup.string().nullable().default(null),
      gender: yup
        .string()
        .nullable()
        .when([], (_, schema) =>
          Settings.fields.person.gender?.exclude ||
          Settings.fields.person.gender?.optional
            ? schema
            : schema.required(
              `You must provide the ${Settings.fields.person.gender?.label}`
            )
        )
        .default("")
        .label(Settings.fields.person.gender?.label),
      phoneNumber: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.person.phoneNumber?.label),
      code: yup.string().nullable().default(""),
      endOfTourDate: yupDate
        .nullable()
        .when(
          ["user", "pendingVerification"],
          ([user, pendingVerification], schema) =>
            Settings.fields.person.endOfTourDate?.exclude ||
            Settings.fields.person.endOfTourDate?.optional ||
            !user ||
            !Person.isPendingVerification({ pendingVerification })
              ? schema
              : schema.test(
                "end-of-tour-date",
                `The ${Settings.fields.person.endOfTourDate?.label} date must be in the future`,
                endOfTourDate => endOfTourDate > Date.now()
              )
        )
        .default(null)
        .label(Settings.fields.person.endOfTourDate?.label),
      biography: yup.string().nullable().default(""),
      position: yup.object().nullable().default({}),
      pendingVerification: yup.boolean().default(false),
      status: yup
        .string()
        .nullable()
        .default(() => Model.STATUS.ACTIVE)
    })
    // not actually in the database, the database contains the JSON customFields
    .concat(Person.customFieldsSchema)
    .concat(Person.sensitiveFieldsSchema)
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid name rank status user endOfTourDate avatarUuid position { uuid name type role code status organization { uuid shortName longName identificationCode } location { uuid name } }"

  static allFieldsQuery = `
    uuid
    name
    rank
    avatarUuid
    status
    pendingVerification
    phoneNumber
    user
    domainUsername
    openIdSubject
    biography
    obsoleteCountry
    country {
      uuid
      name
    }
    gender
    endOfTourDate
    code
    emailAddresses {
      network
      address
    }
    position {
      uuid
      name
      type
      role
      organization {
        uuid
        shortName
        longName
        identificationCode
      }
      associatedPositions {
        uuid
        name
        type
        role
        person {
          uuid
          name
          rank
          avatarUuid
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
      }
    }
    previousPositions {
      startTime
      endTime
      position {
        uuid
        name
        previousPeople {
          startTime
          endTime
          person {
            uuid
          }
        }
      }
    }
    customFields
    ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
    ${GRAPHQL_NOTES_FIELDS}
  `

  static autocompleteQueryWithNotes = `${this.autocompleteQuery} ${GRAPHQL_NOTES_FIELDS}`

  constructor(props) {
    super(Model.fillObject(props, Person.yupSchema))
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  humanNameOfStatus() {
    return Person.humanNameOfStatus(this.status)
  }

  static isPendingVerification(person) {
    return person.pendingVerification
  }

  isPendingVerification() {
    return Person.isPendingVerification(this)
  }

  isAdmin() {
    return this.position && this.position.type === Position.TYPE.ADMINISTRATOR
  }

  isSuperuser() {
    return (
      this.position &&
      (this.position.type === Position.TYPE.SUPERUSER ||
        this.position.type === Position.TYPE.ADMINISTRATOR)
    )
  }

  hasAssignedPosition() {
    // has a non-empty position with a non-zero uuid
    return !_isEmpty(this.position) && !!this.position.uuid
  }

  hasActivePosition() {
    return (
      this.hasAssignedPosition() && this.position.status === Model.STATUS.ACTIVE
    )
  }

  // Checks if this user is a valid superuser for a particular organization
  // Must be either
  // - an administrator
  // - a superuser administrating this organization
  // - a superuser administrating this organization's (transitive) parent
  hasAdministrativePermissionsForOrganization(org) {
    if (!org) {
      return false
    }
    if (this.position?.type === Position.TYPE.ADMINISTRATOR) {
      return true
    }
    if (
      this.position?.type !== Position.TYPE.SUPERUSER ||
      !this.position?.organization
    ) {
      return false
    }
    if (this.position.organizationsAdministrated) {
      const orgsAdministratedUuids =
        this.position.organizationsAdministrated.reduce((acc, org) => {
          acc.push(org.uuid)
          org.descendantOrgs.forEach(descOrg => {
            acc.push(descOrg.uuid)
          })
          return acc
        }, [])
      return orgsAdministratedUuids.includes(org.uuid)
    }
    return false
  }

  iconUrl() {
    return PEOPLE_ICON
  }

  toString() {
    if (this.rank) {
      return this.rank + " " + this.name
    } else {
      return this.name || this.domainUsername || this.uuid
    }
  }

  static fullName(person, doTrim) {
    if (person.lastName && person.firstName) {
      return `${Person.formattedLastName(person.lastName, doTrim)}${
        Person.nameDelimiter
      } ${Person.formattedFirstName(person.firstName, doTrim)}`
    } else if (person.lastName) {
      return Person.formattedLastName(person.lastName)
    } else {
      return ""
    }
  }

  static formattedLastName(lastName, doTrim) {
    let r = lastName.toUpperCase()
    if (doTrim) {
      r = r.trim()
    }
    return r
  }

  static formattedFirstName(firstName, doTrim) {
    let r = firstName
    if (doTrim) {
      r = r.trim()
    }
    return r
  }

  static parseFullName(name) {
    const delimiter = name.indexOf(Person.nameDelimiter)
    let lastName = name
    let firstName = ""

    if (delimiter > -1) {
      lastName = name.substring(0, delimiter)
      firstName = name.substring(delimiter + 1, name.length)
    }

    return {
      lastName: lastName.trim().toUpperCase(),
      firstName: firstName.trim()
    }
  }

  getNumberOfFieldsInLeftColumn() {
    return Settings.fields[this.user ? "advisor" : "regular"].person
      .numberOfFieldsInLeftColumn
  }

  getShowPageFieldsOrdered() {
    return this.user
      ? Person.advisorShowPageOrderedFields
      : Person.regularShowPageOrderedFields
  }

  /**
   * @returns Keys of fields which should span over 2 columns
   */
  getFullWidthFields() {
    return (
      Settings.fields[this.user ? "advisor" : "regular"].person
        .showAsFullWidthFields || []
    )
  }

  static initShowPageFieldsOrdered(user) {
    const fieldsArrayFromConfig =
      Settings.fields[user ? "advisor" : "regular"].person.showPageOrderedFields

    return Person.filterInvalidShowPageFields(fieldsArrayFromConfig || [], user)
  }

  static filterInvalidShowPageFields(fieldsArrayFromConfig, user) {
    return fieldsArrayFromConfig.filter(field => {
      if (
        Settings.fields.person[field] ||
        Settings.fields.person?.customFields?.[field] ||
        Settings.fields.person?.customSensitiveInformation?.[field]
      ) {
        return true
      }
      API.logOnServer(
        "WARN",
        "Person.js",
        366,
        `Wrong field name in dictionary.fields.${
          user ? "advisor" : "regular"
        }.showPageOrderedFields, field name: ${field}`
      )
      return false
    })
  }

  getNormalFieldsOrdered() {
    return (
      this.getShowPageFieldsOrdered()
        // filter out custom fields
        .filter(
          key =>
            !Person?.customFields?.[key] &&
            !Person?.customSensitiveInformation?.[key]
        )
    )
  }

  // we want custom fields as an object not array so we can parse it using existing code
  getCustomFieldsOrderedAsObject() {
    return (
      this.getShowPageFieldsOrdered()
        // filter out non-custom fields
        .filter(key => Person?.customFields?.[key])
        .reduce((accum, key) => {
          accum[key] = Person.customFields[key]
          return accum
        }, {})
    )
  }

  // we want custom fields as an object not array so we can parse it using existing code
  getSensitiveFieldsOrderedAsObject() {
    return (
      this.getShowPageFieldsOrdered()
        // filter out non-custom fields
        .filter(key => Person?.customSensitiveInformation?.[key])
        .reduce((accum, key) => {
          accum[key] = Person.customSensitiveInformation[key]
          return accum
        }, {})
    )
  }

  getAssessmentDictionaryPath() {
    return Person.assessmentDictionaryPath
  }

  getAssessmentsConfig() {
    return Person.assessmentConfig || {}
  }

  static FILTERED_CLIENT_SIDE_FIELDS = [
    "firstName",
    "lastName",
    "authorizationGroups"
  ]

  static filterClientSideFields(obj, ...additionalFields) {
    return Model.filterClientSideFields(
      obj,
      ...Person.FILTERED_CLIENT_SIDE_FIELDS,
      ...additionalFields
    )
  }

  filterClientSideFields(...additionalFields) {
    return Person.filterClientSideFields(this, ...additionalFields)
  }

  fixupFields() {
    super.fixupFields()
    if (this.customSensitiveInformation) {
      this[SENSITIVE_CUSTOM_FIELDS_PARENT] = utils.parseSensitiveFields(
        this.customSensitiveInformation
      )
    }
  }

  static isAuthorized(user, customSensitiveInformationField, position) {
    if (Model.isAuthorized(user, customSensitiveInformationField)) {
      return true
    }
    // Else user has to be counterpart
    return user?.position?.associatedPositions?.find(
      pos => pos.uuid === position.uuid
    )
  }

  static getAuthorizedSensitiveFields(
    user,
    customSensitiveInformation,
    position
  ) {
    return Model.getAuthorizedSensitiveFields(
      Person.isAuthorized,
      user,
      customSensitiveInformation,
      position
    )
  }
}
