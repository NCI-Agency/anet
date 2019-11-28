import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import { Position } from "models"
import { runGQL, specialUser } from "../../simutils"

async function getRandomUser(user, variables) {
  const positionsQuery = Object.assign({}, variables, {
    pageNum: 0,
    pageSize: 1
  })
  const totalCount = (
    await runGQL(user, {
      query: `
        query ($positionsQuery: PositionSearchQueryInput) {
          positionList(query: $positionsQuery) {
            totalCount
          }
        }
      `,
      variables: {
        positionsQuery
      }
    })
  ).data.positionList.totalCount
  if (totalCount === 0) {
    return null
  }
  let person
  for (let i = 0; i < Math.max(totalCount, 10); i++) {
    positionsQuery.pageNum = faker.random.number({ max: totalCount - 1 })
    const positions = (
      await runGQL(specialUser, {
        query: `
          query ($positionsQuery: PositionSearchQueryInput) {
            positionList(query: $positionsQuery) {
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
        `,
        variables: {
          positionsQuery
        }
      })
    ).data.positionList.list.filter(p => p.person.domainUsername)
    person = !_isEmpty(positions) && positions[0].person
    if (person) {
      break
    }
  }
  if (!person) {
    return null
  }
  return {
    name: person.domainUsername,
    password: person.domainUsername,
    person: person
  }
}

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
      return getRandomUser(specialUser, {
        status: Position.STATUS.ACTIVE,
        isFilled: true,
        type: [Position.TYPE.ADVISOR]
      })
    }
  },
  {
    name: "existingSuperUser",
    frequency: 1,
    userFunction: async function(value) {
      return getRandomUser(specialUser, {
        status: Position.STATUS.ACTIVE,
        isFilled: true,
        type: [Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]
      })
    }
  },
  {
    name: "existingAdmin",
    frequency: 1,
    userFunction: async function(value) {
      return getRandomUser(specialUser, {
        status: Position.STATUS.ACTIVE,
        isFilled: true,
        type: [Position.TYPE.ADMINISTRATOR]
      })
    }
  }
]

export default userTypes
