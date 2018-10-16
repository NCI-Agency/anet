import { createReport } from './stories/ReportStories'
import faker from 'faker'
import {runGQL} from './simutils'

const simpleScenario =
{
    userTypes:
        [
            {
                name: "newUser",
                frequency: 5,
                userFunction: async function (value) {
                    const username = faker.internet.userName()
                    return { name: username, password: username }
                }
            },
            {
                name: "existingAvisor",
                frequency: 1,
                userFunction: async function (value) {
                    const json = await runGQL({name:"erin", password:"erin"},
                        {
                        query: `
                    query {
                        personList(query: {pageSize: 0, pageNum: 0, status: ACTIVE, role: ADVISOR}) {
                          list {
                            name
                            domainUsername
                          }
                        }
                      }                    
                    `,
                    })
                    const username = faker.random.arrayElement(json.data.personList.list).domainUsername
                    return { name: username, password: username }
                }
            },
        ],
    stories:
        [
            {
                name: "Create Report",
                frequency: 5,
                runnable: createReport,
                userTypes: ["existingAvisor"]
            },
            {
                name: "Create profile",
                frequency: 1,
                runnable: createReport,
                userTypes: ["newUser"]
            }
        ]
}

export { simpleScenario }