import { Settings } from "api"
import Model, { createYupObjectShape, yupDate } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Organization, Position } from "models"
import React from "react"
import AFG_ICON from "resources/afg_small.png"
import PEOPLE_ICON from "resources/people.png"
import RS_ICON from "resources/rs_small.png"
import utils from "utils"
import * as yup from "yup"

export const advisorPerson = Settings.fields.advisor.person
export const principalPerson = Settings.fields.principal.person

export default class Person extends Model {
  static resourceName = "Person"
  static listName = "personList"
  static getInstanceName = "person"
  static getModelNameLinkTo = "person"

  static STATUS = {
    NEW_USER: "NEW_USER",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
  }

  static ROLE = {
    ADVISOR: "ADVISOR",
    PRINCIPAL: "PRINCIPAL"
  }

  static nameDelimiter = ","

  // create yup schema for the customFields, based on the customFields config
  static customFieldsSchema = createYupObjectShape(
    Settings.fields.person.customFields
  )

  static yupSchema = yup
    .object()
    .shape({
      uuid: yup
        .string()
        .nullable()
        .default(null),
      name: yup
        .string()
        .nullable()
        .default(""),
      // not actually in the database, but used for validation
      firstName: yup
        .string()
        .nullable()
        .when("role", (role, schema) =>
          Person.isAdvisor({ role })
            ? schema.required(
              `You must provide the ${Settings.fields.person.firstName}`
            )
            : schema.nullable()
        )
        .default("")
        .label(Settings.fields.person.firstName),
      // not actually in the database, but used for validation
      lastName: yup
        .string()
        .nullable()
        .uppercase()
        .required(`You must provide the ${Settings.fields.person.lastName}`)
        .default("")
        .label(Settings.fields.person.lastName),
      domainUsername: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.person.domainUsername),
      emailAddress: yup
        .string()
        .nullable()
        .email()
        .when("role", (role, schema) =>
          schema.test(
            "emailAddress",
            "emailAddress error",
            // can't use arrow function here because of binding to 'this'
            function(emailAddress) {
              const r = utils.handleEmailValidation(
                emailAddress,
                role === Person.ROLE.ADVISOR
              )
              return r.isValid ? true : this.createError({ message: r.message })
            }
          )
        )
        .default("")
        .label(Settings.fields.person.emailAddress),
      country: yup
        .string()
        .nullable()
        .required(`You must provide the ${Settings.fields.person.country}`)
        .default("")
        .label(Settings.fields.person.country),
      rank: yup
        .string()
        .nullable()
        .required(
          `You must provide the ${Settings.fields.person.rank} (Military rank, CIV and CTR values are available)`
        )
        .default("")
        .label(Settings.fields.person.rank),
      gender: yup
        .string()
        .nullable()
        .required(`You must provide the ${Settings.fields.person.gender}`)
        .default("")
        .label(Settings.fields.person.gender),
      phoneNumber: yup
        .string()
        .nullable()
        .default("")
        .label(Settings.fields.person.phoneNumber),
      code: yup
        .string()
        .nullable()
        .default(""),
      endOfTourDate: yupDate
        .nullable()
        .when(["role", "status"], (role, status, schema) => {
          if (Person.isPrincipal({ role })) {
            return schema
          } else {
            schema = schema.required(
              `You must provide the ${Settings.fields.person.endOfTourDate}`
            )
            if (Person.isNewUser({ status })) {
              schema = schema.test(
                "end-of-tour-date",
                `The ${Settings.fields.person.endOfTourDate} date must be in the future`,
                endOfTourDate => endOfTourDate > Date.now()
              )
            }
            return schema
          }
        })
        .default(null)
        .label(Settings.fields.person.endOfTourDate),
      biography: yup
        .string()
        .nullable()
        .default(""),
      position: yup
        .object()
        .nullable()
        .default({}),
      role: yup
        .string()
        .nullable()
        .default(() => Person.ROLE.PRINCIPAL),
      status: yup
        .string()
        .nullable()
        .default(() => Person.STATUS.ACTIVE),
      // not actually in the database, the database contains the JSON customFields
      formCustomFields: yup
        .object()
        .shape(Person.customFieldsSchema)
        .nullable()
    })
    .concat(Model.yupSchema)

  static autocompleteQuery =
    "uuid, name, rank, role, status, endOfTourDate, avatar(size: 32), position { uuid, name, type, code, status, organization { uuid, shortName }, location {uuid, name} }"

  static autocompleteTemplate(person) {
    return (
      <span>
        <img
          src={new Person(person).iconUrl()}
          alt={person.role}
          height={20}
          className="person-icon"
        />
        {new Person(person).toString()}{" "}
        {person.position &&
          `- (${person.position.name}` +
            (person.position.code ? `, ${person.position.code}` : "") +
            (person.position.location
              ? `, ${person.position.location.name}`
              : "") +
            ")"}
      </span>
    )
  }

  static humanNameOfRole(role) {
    if (role === Person.ROLE.ADVISOR) {
      return Settings.fields.advisor.person.name
    }
    if (role === Person.ROLE.PRINCIPAL) {
      return principalPerson.name
    }
    throw new Error(`Unrecognized role: ${role}`)
  }

  static humanNameOfStatus(status) {
    return utils.sentenceCase(status)
  }

  constructor(props) {
    super(Model.fillObject(props, Person.yupSchema))
  }

  humanNameOfRole() {
    return Person.humanNameOfRole(this.role)
  }

  humanNameOfStatus() {
    return Person.humanNameOfStatus(this.status)
  }

  static isNewUser(person) {
    return person.status === Person.STATUS.NEW_USER
  }

  isNewUser() {
    return Person.isNewUser(this)
  }

  static isAdvisor(person) {
    return person.role === Person.ROLE.ADVISOR
  }

  isAdvisor() {
    return Person.isAdvisor(this)
  }

  static isPrincipal(person) {
    return person.role === Person.ROLE.PRINCIPAL
  }

  isPrincipal() {
    return Person.isPrincipal(this)
  }

  isAdmin() {
    return this.position && this.position.type === Position.TYPE.ADMINISTRATOR
  }

  isSuperUser() {
    return (
      this.position &&
      (this.position.type === Position.TYPE.SUPER_USER ||
        this.position.type === Position.TYPE.ADMINISTRATOR)
    )
  }

  hasAssignedPosition() {
    // has a non-empty position with a non-zero uuid
    return !_isEmpty(this.position) && !!this.position.uuid
  }

  hasActivePosition() {
    return (
      this.hasAssignedPosition() &&
      this.position.status === Position.STATUS.ACTIVE
    )
  }

  // Checks if this user is a valid super user for a particular organization
  // Must be either
  // - An Administrator
  // - A super user and this org is a PRINCIPAL_ORG
  // - A super user for this organization
  // - A super user for this orgs parents.
  isSuperUserForOrg(org) {
    if (!org) {
      return false
    }
    if (this.position && this.position.type === Position.TYPE.ADMINISTRATOR) {
      return true
    }
    if (this.position && this.position.type !== Position.TYPE.SUPER_USER) {
      return false
    }
    if (org.type === Organization.TYPE.PRINCIPAL_ORG) {
      return true
    }

    if (!this.position || !this.position.organization) {
      return false
    }
    const orgs = this.position.organization.descendantOrgs || []
    orgs.push(this.position.organization)
    const orgUuids = orgs.map(o => o.uuid)

    return orgUuids.includes(org.uuid)
  }

  iconUrl() {
    if (this.isAdvisor()) {
      return RS_ICON
    } else if (this.isPrincipal()) {
      return AFG_ICON
    } else {
      return PEOPLE_ICON
    }
  }

  toString() {
    if (this.rank) {
      return this.rank + " " + this.name
    } else {
      return this.name || this.uuid
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
}
