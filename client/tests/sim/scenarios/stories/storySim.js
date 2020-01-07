import { createHierarchy } from "../../stories/OrganizationStories"
import {
  createPerson,
  deletePerson,
  updatePerson
} from "../../stories/PersonStories"
import {
  createPosition,
  deletePersonFromPosition,
  deletePosition,
  putPersonInPosition,
  removeAssociatedPosition,
  updateAssociatedPosition,
  updatePosition
} from "../../stories/PositionStories"
import {
  approveReport,
  createReport,
  submitDraftReport,
  updateDraftReport
} from "../../stories/ReportStories"

const stories = [
  {
    name: "Create Report",
    frequency: 10,
    runnable: createReport,
    userTypes: ["existingAdvisor"]
  },
  {
    name: "Update Draft Report",
    frequency: 40,
    runnable: updateDraftReport,
    userTypes: ["existingAdvisor"]
  },
  {
    name: "Submit Draft Report",
    frequency: 10,
    runnable: submitDraftReport,
    userTypes: ["existingAdvisor"]
  },
  {
    name: "Approve Report",
    frequency: 10,
    runnable: approveReport,
    userTypes: ["existingAdvisor"]
  },
  {
    name: "Create profile",
    frequency: 1,
    runnable: createReport,
    userTypes: ["newUser"]
  },
  {
    name: "Create person",
    frequency: 1,
    mean: 1,
    stddev: 0,
    runnable: createPerson,
    userTypes: ["existingSuperUser"]
  },
  {
    name: "Update person",
    frequency: 1 / 10,
    runnable: updatePerson,
    userTypes: ["existingSuperUser"]
  },
  {
    name: "Delete person",
    frequency: 1,
    mean: 125,
    stddev: 10,
    runnable: deletePerson,
    userTypes: ["existingSuperUser"]
  },
  {
    name: "Create organization",
    frequency: 1 / 10,
    mean: 100,
    stddev: 1 / 10,
    runnable: createHierarchy,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Create position",
    frequency: 1 / 10,
    mean: 75,
    stddev: 20,
    runnable: createPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Activate position",
    frequency: 1 / 10,
    mean: 75,
    stddev: 20,
    runnable: createPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Delete position",
    frequency: 1 / 100,
    mean: 75,
    stddev: 20,
    runnable: deletePosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Put person in position",
    frequency: 1,
    runnable: putPersonInPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Associated advisor position with principal position",
    frequency: 1,
    runnable: updateAssociatedPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Remove advisor position from principal position",
    frequency: 1,
    runnable: removeAssociatedPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Remove person from position",
    frequency: 1 / 50,
    runnable: deletePersonFromPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Update position",
    frequency: 1,
    runnable: updatePosition,
    userTypes: ["existingAdmin"]
  }
]

export default stories
