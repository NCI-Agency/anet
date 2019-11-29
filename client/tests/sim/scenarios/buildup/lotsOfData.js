import { Person, Organization, Report } from "models"
import { createLocation } from "../../stories/LocationStories"
import { createNote } from "../../stories/NoteStories"
import { createHierarchy } from "../../stories/OrganizationStories"
import { createPerson } from "../../stories/PersonStories"
import { createReport } from "../../stories/ReportStories"

const buildupLotsOfData = [
  {
    name: "Create location",
    number: 500,
    runnable: createLocation,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {}
  },
  {
    name: "Create active advisor",
    number: 2000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { role: Person.ROLE.ADVISOR, status: Person.STATUS.ACTIVE }
  },
  {
    name: "Create inactive advisor",
    number: 10000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { role: Person.ROLE.ADVISOR, status: Person.STATUS.INACTIVE }
  },
  {
    name: "Create active principal",
    number: 10000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { role: Person.ROLE.PRINCIPAL, status: Person.STATUS.ACTIVE }
  },
  {
    name: "Create inactive principal",
    number: 10000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { role: Person.ROLE.PRINCIPAL, status: Person.STATUS.INACTIVE }
  },
  {
    name: "Create advisor organization",
    number: 200,
    runnable: createHierarchy,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {
      type: Organization.TYPE.ADVISOR_ORG,
      status: Organization.STATUS.ACTIVE,
      subOrgs: false
    }
  },
  {
    name: "Create principal organization",
    number: 1000,
    runnable: createHierarchy,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {
      type: Organization.TYPE.PRINCIPAL_ORG,
      status: Organization.STATUS.ACTIVE,
      subOrgs: false
    }
  },
  {
    name: "Create published report #1",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #2",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #3",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #4",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #5",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #6",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #7",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #8",
    number: 25000,
    runnable: createReport,
    preDelay: 120,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create authorizationGroup note",
    number: 25,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "authorizationGroups" }
  },
  {
    name: "Create location note",
    number: 1000,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "locations" }
  },
  {
    name: "Create organization note",
    number: 1500,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "organizations" }
  },
  {
    name: "Create person note",
    number: 1000,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "people" }
  },
  {
    name: "Create position note",
    number: 100,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "positions" }
  },
  {
    name: "Create task note",
    number: 100,
    runnable: createNote,
    preDelay: 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "tasks" }
  },
  {
    name: "Create report note #1",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #2",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #3",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #4",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #5",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #6",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #7",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #8",
    number: 1000,
    runnable: createNote,
    preDelay: 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  }
]

export default buildupLotsOfData
