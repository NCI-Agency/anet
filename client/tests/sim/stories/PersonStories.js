import { allFakers, allLocales, faker } from "@faker-js/faker"
import Model from "components/Model"
import { countries, getCountryCode } from "countries-list"
import _isEmpty from "lodash/isEmpty"
import { Location, Person } from "models"
import Settings from "settings"
import {
  createEmailAddresses,
  createHtmlParagraphs,
  fuzzy,
  getRandomObject,
  identity,
  populate,
  runGQL
} from "../simutils"
import afghanFirstNames from "./afghanFirstNames"
import afghanSurnames from "./afghanSurnames"

const availableLocales = Object.keys(allLocales)
const availableRanks = Settings.fields.person.ranks.map(r => r.value)

function afghanName(gender) {
  const genderForName =
    gender === "NOT SPECIFIED" ? undefined : gender.toLowerCase().charAt(0)
  return {
    firstName: faker.helpers.arrayElement(
      afghanFirstNames.filter(d => !genderForName || d.gender === genderForName)
    ).name,
    lastName: faker.helpers.arrayElement(afghanSurnames).name
  }
}

function personName(gender, locale) {
  const genderForName =
    gender === "NOT SPECIFIED" ? undefined : gender.toLowerCase()
  const localeFaker = allFakers[locale]
  return {
    firstName: localeFaker.person.firstName(genderForName),
    lastName: localeFaker.person.lastName(genderForName)
  }
}

async function randomPerson(isUser, status) {
  const gender = fuzzy.withProbability(0.1)
    ? "NOT SPECIFIED"
    : fuzzy.withProbability(0.5)
      ? "MALE"
      : "FEMALE"
  const defaultLangCode = "en"
  const country = await getRandomObject(
    "locations",
    { type: Location.LOCATION_TYPES.COUNTRY },
    "uuid name digram"
  )
  const countryCode = getCountryCode(country.name) || country.digram
  const countryByCode = countries[countryCode]
  // Some hacks for picking country-specific languages supported by faker
  const fakerHacks = {
    AT: "de_AT",
    AU: "en_AU",
    BE: "nl_BE",
    GB: "en_GB",
    NO: "nb_NO",
    PT: "pt_PT",
    US: "en_US"
  }
  const langCode =
    fakerHacks[countryCode] ||
    (_isEmpty(countryByCode?.languages)
      ? defaultLangCode
      : faker.helpers.arrayElement(countryByCode.languages))
  const locale = availableLocales.includes(langCode)
    ? langCode
    : defaultLangCode
  const name = (fuzzy.withProbability(0.1) ? afghanName : personName)(
    gender,
    locale
  )
  const rank = faker.helpers.arrayElement(availableRanks)
  let domainUsername
  if (isUser) {
    domainUsername = faker.internet.username({
      firstName: name.firstName,
      lastName: name.lastName
    })
  }
  let email
  if (isUser || fuzzy.withProbability(0.25)) {
    email = faker.internet.displayName({
      firstName: name.firstName,
      lastName: name.lastName
    })
  }

  return {
    name: () => Person.fullName(name, true),
    status: () => status || Model.STATUS.ACTIVE,
    country: () => country,
    rank: () => rank,
    gender: () => gender,
    phoneNumber: () => faker.phone.phoneNumber(),
    endOfTourDate: () => faker.date.future(),
    biography: async() => await createHtmlParagraphs(),
    user: () => isUser,
    domainUsername: () => domainUsername,
    emailAddresses: () => createEmailAddresses(isUser, email)
  }
}

function modifiedPerson() {
  return {
    name: identity,
    domainUsername: identity,
    status: identity,
    country: identity,
    rank: identity,
    gender: identity,
    phoneNumber: () => faker.phone.phoneNumber(),
    endOfTourDate: () => faker.date.future(),
    biography: async() => await createHtmlParagraphs(),
    user: identity,
    emailAddresses: (value, instance) => {
      const name = Person.parseFullName(instance.name)
      const email = faker.internet.displayName({
        firstName: name.firstName,
        lastName: name.lastName
      })
      return createEmailAddresses(instance.user, email)
    }
  }
}

const _createPerson = async function(user, isUser, status) {
  const person = Person.filterClientSideFields(new Person())
  const personGenerator = await populate(
    person,
    await randomPerson(isUser, status)
  )
  await personGenerator.name.always()
  await personGenerator.status.always()
  await personGenerator.rank.always()
  await personGenerator.user.always()
  await personGenerator.domainUsername.always()
  await personGenerator.country.always()
  await personGenerator.gender.always()
  await personGenerator.endOfTourDate.always()
  await personGenerator.biography.always()
  await personGenerator.emailAddresses.always()

  console.debug(
    `Creating ${person.user ? "user " : ""}${
      person.gender.toLowerCase().green
    } ${person.name.green}`
  )

  const { firstName, lastName, ...personStripped } = person // TODO: we need to do this more generically
  return (
    await runGQL(user, {
      query:
        "mutation($person: PersonInput!) { createPerson(person: $person) { uuid } }",
      variables: { person: personStripped }
    })
  ).data.createPerson
}

const updatePerson = async function(user) {
  const totalCount = (
    await runGQL(user, {
      query: `
      query {
        personList(query: {
          pageNum: 0,
          pageSize: 1,
          status: ${Model.STATUS.ACTIVE}
        }) {
          totalCount
        }
      }
    `,
      variables: {}
    })
  ).data.personList.totalCount
  if (totalCount === 0) {
    return null
  }
  const random = faker.number.int({ max: totalCount - 1 })
  const people = (
    await runGQL(user, {
      query: `
      query {
        personList(query: {
          pageNum: ${random},
          pageSize: 1,
          status: ${Model.STATUS.ACTIVE}
        }) {
          list {
            uuid
            biography
            country {
              uuid
            }
            endOfTourDate
            gender
            name
            domainUsername
            phoneNumber
            rank
            role
            status
          }
        }
      }
    `,
      variables: {}
    })
  ).data.personList.list

  const person = people && people[0]
  const personGenerator = await populate(person, modifiedPerson())
  await personGenerator.name.rarely()
  await personGenerator.domainUsername.never()
  await personGenerator.phoneNumber.sometimes()
  await personGenerator.rank.sometimes()
  await personGenerator.country.never()
  await personGenerator.gender.never()
  await personGenerator.endOfTourDate.sometimes()
  await personGenerator.biography.often()
  await personGenerator.emailAddresses.rarely()

  return (
    await runGQL(user, {
      query:
        "mutation($person: PersonInput!) { updatePerson(person: $person) }",
      variables: { person }
    })
  ).data.updatePerson
}

const _deletePerson = async function(user) {
  const totalCount = (
    await runGQL(user, {
      query: `
      query {
        personList(query: {
          pageNum: 0,
          pageSize: 1,
          status: ${Model.STATUS.ACTIVE}
      }) {
        totalCount
      }
    }
  `,
      variables: {}
    })
  ).data.personList.totalCount
  if (totalCount === 0) {
    return null
  }
  let person
  for (let i = 0; i < Math.max(totalCount, 10); i++) {
    const random = faker.number.int({ max: totalCount - 1 })
    const people = (
      await runGQL(user, {
        query: `
        query {
          personList(query: {
            pageNum: ${random},
            pageSize: 1,
            status: ${Model.STATUS.ACTIVE}
        }) {
          list {
            uuid
            name
            biography
            country {
              uuid
            }
            endOfTourDate
            gender
            phoneNumber
            rank
            status
            position {
              uuid
            }
          }
        }
      }
    `,
        variables: {}
      })
    ).data.personList.list.filter(p => !p.position)
    person = people && people[0]
    if (person) {
      break
    }
  }
  if (person) {
    person.status = Model.STATUS.INACTIVE

    console.debug(`Deleting/Deactivating ${person.name.green}`)
    // This should DEACTIVATE a person. Note: only possible if (s)he is removed from position.
    return (
      await runGQL(user, {
        query:
          "mutation($person: PersonInput!) { updatePerson(person: $person) }",
        variables: { person }
      })
    ).data.updatePerson
  } else {
    console.debug("No person to delete")
    return null
  }
}

async function countPersons(user) {
  return (
    await runGQL(user, {
      query: `
      query {
        personList(query: {
          pageNum: 0,
          pageSize: 1
        }) {
          totalCount
        }
      }
    `,
      variables: {}
    })
  ).data.personList.totalCount
}

const createPerson = async function(user, grow, args) {
  if (grow) {
    const count = await countPersons(user)
    if (!grow(count)) {
      console.debug(`Skipping create person (currently ${count} persons exist)`)
      return "(skipped)"
    }
  }
  return _createPerson(user, args?.user, args?.status)
}

const deletePerson = async function(user, grow) {
  if (grow) {
    const count = await countPersons(user)
    if (grow(count)) {
      console.debug(`Skipping delete person (currently ${count} persons exist)`)
      return "(skipped)"
    }
  }
  return _deletePerson(user)
}

export { createPerson, updatePerson, deletePerson }
