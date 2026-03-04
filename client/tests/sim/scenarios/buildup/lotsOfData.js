import Model from "components/Model"
import { Report } from "models"
import { createHierarchy as createLocationHierarchy } from "../../stories/LocationStories"
import { createNote } from "../../stories/NoteStories"
import { createHierarchy as createOrganizationHierarchy } from "../../stories/OrganizationStories"
import { createPerson } from "../../stories/PersonStories"
import { createPosition } from "../../stories/PositionStories"
import { createReport } from "../../stories/ReportStories"

const TEST_RUN = !!process.env.TEST_RUN

const buildupLotsOfData = [
  {
    name: "Create location",
    nrOfParallelTasks: TEST_RUN ? 1 : 4,
    number: TEST_RUN ? 1 : 25,
    runnable: createLocationHierarchy,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {
      status: Model.STATUS.ACTIVE,
      subLocations: true
    }
  },
  {
    name: "Create user",
    nrOfParallelTasks: TEST_RUN ? 1 : 4,
    number: TEST_RUN ? 1 : 500,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { user: true, status: Model.STATUS.ACTIVE }
  },
  {
    name: "Create active person",
    nrOfParallelTasks: TEST_RUN ? 1 : 4,
    number: TEST_RUN ? 1 : 2500,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { status: Model.STATUS.ACTIVE }
  },
  {
    name: "Create inactive person",
    nrOfParallelTasks: TEST_RUN ? 1 : 4,
    number: TEST_RUN ? 1 : 2500,
    runnable: createPerson,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: { status: Model.STATUS.INACTIVE }
  },
  {
    name: "Create organization",
    nrOfParallelTasks: TEST_RUN ? 1 : 4,
    number: TEST_RUN ? 1 : 25,
    runnable: createOrganizationHierarchy,
    preDelay: 0,
    userTypes: ["existingAdmin"],
    arguments: {
      status: Model.STATUS.ACTIVE,
      subOrgs: true
    }
  },
  {
    name: "Create position",
    nrOfParallelTasks: TEST_RUN ? 1 : 16,
    number: TEST_RUN ? 1 : 1250,
    runnable: createPosition,
    preDelay: TEST_RUN ? 5 : 30,
    userTypes: ["existingAdmin"],
    arguments: {}
  },
  {
    name: "Create published report",
    nrOfParallelTasks: TEST_RUN ? 1 : 16,
    number: TEST_RUN ? 1 : 12500,
    runnable: createReport,
    preDelay: TEST_RUN ? 10 : 240,
    userTypes: ["existingAdmin"],
    arguments: { state: Report.STATE.PUBLISHED }
  },
  {
    name: "Create authorizationGroup note",
    number: TEST_RUN ? 1 : 25,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "authorizationGroups" }
  },
  {
    name: "Create location note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "locations" }
  },
  {
    name: "Create organization note",
    number: TEST_RUN ? 1 : 1500,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "organizations" }
  },
  {
    name: "Create person note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "people" }
  },
  {
    name: "Create position note",
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 10 : 240,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "positions" }
  },
  {
    name: "Create task note",
    number: TEST_RUN ? 1 : 100,
    runnable: createNote,
    preDelay: TEST_RUN ? 6 : 60,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "tasks" }
  },
  {
    name: "Create report note",
    nrOfParallelTasks: TEST_RUN ? 1 : 8,
    number: TEST_RUN ? 1 : 1000,
    runnable: createNote,
    preDelay: TEST_RUN ? 10 : 480,
    userTypes: ["existingAdmin"],
    arguments: { relatedObjectType: "reports" }
  }
]

export default buildupLotsOfData
