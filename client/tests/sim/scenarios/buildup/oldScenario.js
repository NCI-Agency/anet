import { createHierarchy } from "../../stories/OrganizationStories"
import { createPerson } from "../../stories/PersonStories"
import {
  createPosition,
  putPersonInPosition,
  updateAssociatedPosition
} from "../../stories/PositionStories"

const buildupOld = [
  {
    name: "Create person",
    number: 100,
    runnable: createPerson,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Create organization",
    number: 50,
    runnable: createHierarchy,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Create position",
    number: 50,
    runnable: createPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Put person in position",
    number: 50,
    runnable: putPersonInPosition,
    userTypes: ["existingAdmin"]
  },
  {
    name: "Associated advisor position with principal position",
    number: 750,
    runnable: updateAssociatedPosition,
    userTypes: ["existingAdmin"]
  }
]

export default buildupOld
