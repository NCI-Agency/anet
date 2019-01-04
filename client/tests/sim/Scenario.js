import { createReport } from './stories/ReportStories'
import faker from 'faker'
import {runGQL} from './simutils'
import { personsBuildup, createPerson } from './stories/PersonStories'
import { organizationsBuildup, createHiearchy } from './stories/OrganizationStories'
import { positionsBuildup, assignedPositionsBuildup, createPosition, updatePosition, deletePosition, putPersonInPosition, deletePersonFromPosition, updateAssociatedPosition, removeAssociatedPosition } from './stories/PositionStories'

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
                          }
                        }
                      }                    
                    `,
                    })
                    const person = faker.random.arrayElement(json.data.personList.list)
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
                runnable: personsBuildup,
                userTypes: ["existingAdmin"]
            },
            {
                name: "Create organization",
                number: 50,
                runnable: organizationsBuildup,
                userTypes: ["existingAdmin"]
            },
            {
                name: "Create position",
                number: 50,
                runnable: positionsBuildup,
                userTypes: ["existingAdmin"]
            },
            {
                name: "Put person in position",
                number: 50,
                runnable: assignedPositionsBuildup,
                userTypes: ["existingAdmin"]
            }
            // {
            //     name: "Associated advisor position with principal position",
            //     number: 750,
            //     runnable: updateAssociatedPosition,
            //     userTypes: ["existingAdmin"]
            // }
        ],
    stories:
        [
            // {
            //     name: "Create Report",
            //     frequency: 2,
            //     runnable: createReport,
            //     userTypes: ["existingAdvisor"]
            // },
            // {
            //     name: "Create profile",
            //     frequency: 1,
            //     runnable: createReport,
            //     userTypes: ["newUser"]
            // },
            // {
            //     name: "Create person",
            //     frequency: 1,
            //     runnable: createPerson,
            //     userTypes: ["existingAdvisor"]
            // },
            // {
            //     name: "Create organization",
            //     frequency: 1,
            //     runnable: createHiearchy,
            //     userTypes: ["existingAdmin"]
            // },
            {
                name: "Create position",
                frequency: 1,
                runnable: createPosition,
                userTypes: ["existingAdmin"]
            }
            // {
            //     name: "Put person in position",
            //     frequency: 1,
            //     runnable: putPersonInPosition,
            //     userTypes: ["existingAdmin"]
            // }
            // {
            //     name: "Associated advisor position with principal position",
            //     frequency: 1,
            //     runnable: updateAssociatedPosition,
            //     userTypes: ["existingAdmin"]
            // }
            // {
            //     name: "Remove advisor position from principal position",
            //     frequency: 1,
            //     runnable: removeAssociatedPosition,
            //     userTypes: ["existingAdmin"]
            // }            
            // {
            //     name: "Remove person from position",
            //     frequency: 1,
            //     runnable: deletePersonFromPosition,
            //     userTypes: ["existingAdmin"]
            // }            
            // {
            //     name: "Delete a position",
            //     frequency: 1,
            //     runnable: deletePosition,
            //     userTypes: ["existingAdmin"]
            // }    
            // {
            //     name: "Update a position",
            //     frequency: 1,
            //     runnable: updatePosition,
            //     userTypes: ["existingAdmin"]
            // }            
        ]
}

export { simpleScenario }