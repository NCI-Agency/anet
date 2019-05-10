import faker from "faker"
import { Position } from "models"
import { runGQL, specialUser } from "./simutils"
import { createHiearchy } from "./stories/OrganizationStories"
import {
  createPerson,
  deletePerson,
  updatePerson
} from "./stories/PersonStories"
import {
  createPosition,
  deletePersonFromPosition,
  deletePosition,
  putPersonInPosition,
  removeAssociatedPosition,
  updateAssociatedPosition,
  updatePosition
} from "./stories/PositionStories"
import {
  approveReport,
  createReport,
  submitDraftReport,
  updateDraftReport
} from "./stories/ReportStories"

const simpleScenario = {
  userTypes: [
    {
      name: "newUser",
      frequency: 30,
      userFunction: async function(value) {
        const username = faker.internet.userName()
        return { name: username, password: username }
      }
    },
    {
      name: "existingAdvisor",
      frequency: 1,
      userFunction: async function(value) {
        const positions = (await runGQL(
          { ...specialUser },
          {
            query: `
              query {
                positionList(query: {
                  pageSize: 0,
                  pageNum: 0,
                  status: ${Position.STATUS.ACTIVE},
                  isFilled: true,
                  type: [${Position.TYPE.ADVISOR}]
                }) {
                  list {
                    uuid
                    type
                    person {
                      uuid
                      name
                      domainUsername
                    }
                  }
                }
              }
            `
          }
        )).data.positionList.list
        const person = faker.random.arrayElement(
          positions.filter(p => p.person.domainUsername)
        ).person
        return {
          name: person.domainUsername,
          password: person.domainUsername,
          person: person
        }
      }
    },
    {
      name: "existingSuperUser",
      frequency: 1,
      userFunction: async function(value) {
        const positions = (await runGQL(
          { ...specialUser },
          {
            query: `
              query {
                positionList(query: {
                  pageSize: 0,
                  pageNum: 0,
                  status: ${Position.STATUS.ACTIVE},
                  isFilled: true,
                  type: [${Position.TYPE.SUPER_USER}, ${
            Position.TYPE.ADMINISTRATOR
          }]
                }) {
                  list {
                    uuid
                    type
                    person {
                      uuid
                      name
                      domainUsername
                    }
                  }
                }
              }
            `
          }
        )).data.positionList.list
        const person = faker.random.arrayElement(
          positions.filter(p => p.person.domainUsername)
        ).person
        return {
          name: person.domainUsername,
          password: person.domainUsername,
          person: person
        }
      }
    },
    {
      name: "existingAdmin",
      frequency: 1,
      userFunction: async function(value) {
        const positions = (await runGQL(
          { ...specialUser },
          {
            query: `
              query {
                positionList(query: {
                  pageSize: 0,
                  pageNum: 0,
                  status: ${Position.STATUS.ACTIVE},
                  isFilled: true,
                  type: [${Position.TYPE.ADMINISTRATOR}]
                }) {
                  list {
                    uuid
                    type
                    person {
                      uuid
                      name
                      domainUsername
                    }
                  }
                }
              }
            `
          }
        )).data.positionList.list
        const person = faker.random.arrayElement(
          positions.filter(p => p.person.domainUsername)
        ).person
        return {
          name: person.domainUsername,
          password: person.domainUsername,
          person: person
        }
      }
    }
  ],
  buildup: [
    {
      name: "Create person",
      number: 100,
      runnable: createPerson,
      userTypes: ["existingAdmin"]
    },
    {
      name: "Create organization",
      number: 50,
      runnable: createHiearchy,
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
  ],
  stories: [
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
      mean: 125,
      stddev: 10,
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
      runnable: createHiearchy,
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
}

export { simpleScenario }
