import { createReport } from './stories/ReportStories'
import faker from 'faker'
import {runGQL, fuzzy} from './simutils'
import { updatePerson, createPerson, deletePerson } from './stories/PersonStories'
import { createHiearchy } from './stories/OrganizationStories'
import { createPosition, updatePosition, deletePosition, putPersonInPosition, deletePersonFromPosition, updateAssociatedPosition, removeAssociatedPosition } from './stories/PositionStories'
import { Position } from 'models'

const simpleScenario =
{
    userTypes:
        [
            {
                name: "newUser",
                frequency: 30,
                userFunction: async function (value) {
                    const username = faker.internet.userName()
                    return { name: username, password: username }
                }
            },
            {
                name: "existingAdvisor",
                frequency: 1,
                userFunction: async function (value) {
                    const json = await runGQL({name:"erin", password:"erin"},
                        {
                        query: `
                    query {
                        personList(query: {pageSize: 0, pageNum: 0, status: ACTIVE, role: ADVISOR}) {
                          list {
                            uuid
                            name
                            domainUsername
                            position {
                                uuid
                            }
                          }
                        }
                      }                    
                    `,
                    })
                    const person = faker.random.arrayElement(json.data.personList.list.filter(p => p.domainUsername))
                    return { name: person.domainUsername, password: person.domainUsername, person: person }
                }
            },
            {
                name: "existingSuperUser",
                frequency: 1,
                userFunction: async function (value) {
                    const json = await runGQL({name:"erin", password:"erin"},
                        {
                        query: `
                    query {
                        personList(query: {pageSize: 0, pageNum: 0, status: ACTIVE, role: ADVISOR}) {
                          list {
                            uuid
                            name
                            domainUsername
                            position {
                                uuid
                                type
                            }
                          }
                        }
                      }                    
                    `,
                    })
                    const person = faker.random.arrayElement(json.data.personList.list.filter(p => {
                        return p.domainUsername && p.position && (
                            p.position.type === Position.TYPE.SUPER_USER ||
                            p.position.type === Position.TYPE.ADMINISTRATOR
                        )
                    }))
                    return { name: person.domainUsername, password: person.domainUsername, person: person }
                }
            },
            {
                name: "existingAdmin",
                frequency: 1,
                userFunction: async function (value) {
                    // const json = await runGQL({name:"erin", password:"erin"},
                    //     {
                    //     query: `
                    // query {
                    //     personList(query: {pageSize: 0, pageNum: 0, status: ACTIVE, role: ADVISOR}) {
                    //       list {
                    //         uuid
                    //         name
                    //         domainUsername
                    //       }
                    //     }
                    //   }                    
                    // `,
                    // })
                    // const person = faker.random.arrayElement(json.data.personList.list)
                    // return { name: person.domainUsername, password: person.domainUsername, person: person }
                    return { name: 'arthur', password: '', person: {} }
                }
            }
        ],
    buildup: 
        [
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
    stories:
        [
            {
                name: "Create Report",
                frequency: 20,
                runnable: createReport,
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
                frequency: 10 / 10,
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
                frequency: 1,
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