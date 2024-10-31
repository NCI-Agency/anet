import { faker } from "@faker-js/faker"

// These are the users configured in Keycloak, which can be used to execute GQL requests
const admins = ["arthur", "michael"]
const superusers = [
  ...admins,
  "andrew",
  "bob",
  "dwight",
  "henry",
  "jacob",
  "jim",
  "rebecca"
]
const advisors = [
  ...superusers,
  "advisor",
  "bonny",
  "creed",
  "elizabeth",
  "erin",
  "inter",
  "jack",
  "kevin",
  "lin",
  "nick",
  "reina",
  "reportgirl",
  "reportguy",
  "selena",
  "yoshie"
]
const userTypes = [
  {
    name: "newUser",
    frequency: 1,
    userFunction: async function(value) {
      const username = faker.internet.username()
      return { name: username, password: username }
    }
  },
  {
    name: "existingAdvisor",
    frequency: 1,
    userFunction: async function(value) {
      const username = faker.helpers.arrayElement(advisors)
      return { name: username, password: username }
    }
  },
  {
    name: "existingSuperuser",
    frequency: 1,
    userFunction: async function(value) {
      const username = faker.helpers.arrayElement(superusers)
      return { name: username, password: username }
    }
  },
  {
    name: "existingAdmin",
    frequency: 1,
    userFunction: async function(value) {
      const username = faker.helpers.arrayElement(admins)
      return { name: username, password: username }
    }
  }
]

export default userTypes
