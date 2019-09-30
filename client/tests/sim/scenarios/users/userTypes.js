import faker from "faker"
import { Position } from "models"
import { runGQL, specialUser } from "../../simutils"

const userTypes = [
  {
    name: "newUser",
    frequency: 1,
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
                  type: [
                    ${Position.TYPE.SUPER_USER},
                    ${Position.TYPE.ADMINISTRATOR}
                  ]
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
]

export default userTypes
