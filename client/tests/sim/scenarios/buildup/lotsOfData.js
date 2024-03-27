import Model from "components/Model"
import { Report } from "models"
import { createLocation } from "../../stories/LocationStories"
import { createNote } from "../../stories/NoteStories"
import { createHierarchy } from "../../stories/OrganizationStories"
import { createPerson } from "../../stories/PersonStories"
import { createPosition } from "../../stories/PositionStories"
import { createReport } from "../../stories/ReportStories"

const TEST_RUN = !!process.env.TEST_RUN

const buildupLotsOfData = [
  {
    name: "Create location",
    number: TEST_RUN ? 1 : 500,
    runnable: createLocation,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {}
  },
  {
    name: "Create user",
    number: TEST_RUN ? 1 : 2000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { user: true, status: Model.STATUS.ACTIVE }
  },
  {
    name: "Create active person",
    number: TEST_RUN ? 1 : 10000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { status: Model.STATUS.ACTIVE }
  },
  {
    name: "Create inactive person",
    number: TEST_RUN ? 1 : 10000,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { status: Model.STATUS.INACTIVE }
  },
  {
    name: "Create organization",
    number: TEST_RUN ? 1 : 100,
    runnable: createHierarchy,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {
      status: Model.STATUS.ACTIVE,
      subOrgs: true
    }
  },
  {
    name: "Create position",
    number: TEST_RUN ? 1 : 20000,
    runnable: createPosition,
    preDelay: TEST_RUN ? 3 : 300,
    userTypes: ["existingAdmin"],
    arguments: {}
  },
  {
    name: "Create published report #1",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #2",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #3",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #4",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #5",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #6",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #7",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create published report #8",
    number: TEST_RUN ? 1 : 25000,
    runnable: createReport,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create authorizationGroup note",
    number: TEST_RUN ? 1 : 25,
    runnable: createNote,
    preDelay: TEST_RUN ? 1 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "authorizationGroups" }
  },
  {
    name: "Create location note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 1 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "locations" }
  },
  {
    name: "Create organization note",
    number: TEST_RUN ? 1 : 1500,
    runnable: createNote,
    preDelay: TEST_RUN ? 1 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "organizations" }
  },
  {
    name: "Create person note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 1 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "people" }
  },
  {
    name: "Create position note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 600,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "positions" }
  },
  {
    name: "Create task note",
    number: TEST_RUN ? 1 : 100,
    runnable: createNote,
    preDelay: TEST_RUN ? 1 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "tasks" }
  },
  {
    name: "Create report note #1",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #2",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #3",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #4",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #5",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #6",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #7",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  },
  {
    name: "Create report note #8",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 9 : 900,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  }
]

export default buildupLotsOfData
