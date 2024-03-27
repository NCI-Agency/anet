import { allFakers, allLocales, faker } from "@faker-js/faker"
import Model from "components/Model"
import { countries } from "countries-list"
import { getAlpha2Code } from "i18n-iso-countries"
import { Person } from "models"
import Settings from "settings"
import {
  createEmailAddresses,
  fuzzy,
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

function randomPerson(isUser, status) {
  const gender = fuzzy.withProbability(0.1)
    ? "NOT SPECIFIED"
    : fuzzy.withProbability(0.5)
      ? "MALE"
      : "FEMALE"
  const defaultLangCode = "en"
  const country = faker.helpers.arrayElement(
    Settings.fields.regular.person.countries
  )
  // Countries in the Settings from anet.yml are in English
  const countryCode = getAlpha2Code(country, "en")
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
    (countryByCode
      ? faker.helpers.arrayElement(countryByCode.languages)
      : defaultLangCode)
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
    domainUsername = faker.internet.userName({
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
    biography: () => faker.lorem.paragraphs(),
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
    biography: () => faker.lorem.paragraphs(),
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
  populate(person, randomPerson(isUser, status))
    .name.always()
    .status.always()
    .rank.always()
    .user.always()
    .domainUsername.always()
    .country.always()
    .gender.always()
    .endOfTourDate.always()
    .biography.always()
    .emailAddresses.always()

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
          }
        }
      }
    `,
      variables: {}
    })
  ).data.personList.list

  let person = people && people[0]
  person = (
    await runGQL(user, {
      query: `
      query {
        person (uuid:"${person.uuid}") {
          uuid
          biography
          country
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
    `,
      variables: {}
    })
  ).data.person

  populate(person, modifiedPerson())
    .name.rarely()
    .domainUsername.never()
    .phoneNumber.sometimes()
    .rank.sometimes()
    .country.never()
    .gender.never()
    .endOfTourDate.sometimes()
    .biography.often()
    .emailAddresses.rarely()

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
  let person0
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
    person0 = people && people[0]
    if (person0) {
      break
    }
  }
  if (person0) {
    const person = (
      await runGQL(user, {
        query: `
        query {
          person(uuid: "${person0.uuid}") {
              biography
              country
              endOfTourDate
              gender
              name
              phoneNumber
              rank
              status
              uuid
          }
        }
      `,
        variables: {}
      })
    ).data.person
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
      console.debug(`Skipping delete person (currently ${count} persons exist)`)
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
