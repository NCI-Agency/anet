import { createReport } from './stories/CreateReport'
import faker from 'faker'
import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'

console.log(ApolloClient)

const anetClient = new ApolloClient({ uri: 'http://localhost:8080/graphql?user=erin&pass=erin' })

const simpleScenario =
{
    userTypes:
        [
            {
                name: "newUser",
                frequency: 100,
                userFunction: function () {
                    const domainName = faker.internet.userName
                    return { domainName: domainName, password: domainName }
                }
            },
            {
                name: "existingAvisor",
                frequency: 1,
                userFunction: async function () {
                    
                    
                    anetClient.query({
                        query: gql`
                    query {
                        personList(query: {status: ACTIVE, role: ADVISOR}) {
                          list {
                            name
                            domainUsername
                          }
                        }
                      }                    
                    `,
                    })
                        .then(data => console.log(data))
                        .catch(error => console.error(error));
                    return { domainName: '', password: '' }
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