import { allFakers, allLocales, faker } from "@faker-js/faker"
import Model from "components/Model"
import { countries } from "countries-list"
import { getAlpha2Code } from "i18n-iso-countries"
import { Person } from "models"
import Settings from "settings"
import { fuzzy, identity, populate, runGQL } from "../simutils"
import afghanFirstNames from "./afghanFirstNames"
import afghanSurnames from "./afghanSurnames"

const availableLocales = Object.keys(allLocales)
const availableRanks = Settings.fields.person.ranks.map(r => r.value)

function principalName(gender) {
  return {
    firstName: faker.helpers.arrayElement(
      afghanFirstNames.filter(d => d.gender === gender.toLowerCase().charAt(0))
    ).name,
    lastName: faker.helpers.arrayElement(afghanSurnames).name
  }
}

function advisorName(gender, locale) {
  const localeFaker = allFakers[locale]
  return {
    firstName: localeFaker.person.firstName(gender.toLowerCase()),
    lastName: localeFaker.person.lastName(gender.toLowerCase())
  }
}

function randomPerson(role, status) {
  const gender = fuzzy.withProbability(0.9) ? "MALE" : "FEMALE"
  if (!role) {
    role = faker.helpers.arrayElement([
      Person.ROLE.PRINCIPAL,
      Person.ROLE.ADVISOR
    ])
  }
  const defaultLangCode = "en"
  const country = faker.helpers.arrayElement(
    role === Person.ROLE.PRINCIPAL
      ? Settings.fields.principal.person.countries
      : Settings.fields.advisor.person.countries
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
  const name = (role === Person.ROLE.PRINCIPAL ? principalName : advisorName)(
    gender,
    locale
  )
  const rank = faker.helpers.arrayElement(availableRanks)
  let email = ""
  if (role === Person.ROLE.ADVISOR) {
    let domainName = faker.helpers.arrayElement(Settings.domainNames)
    if (domainName.startsWith("*")) {
      domainName = faker.internet.domainWord() + domainName.slice(1)
    }
    email = faker.internet.email({
      firstName: name.firstName,
      lastName: name.lastName,
      provider: domainName
    })
  } else if (fuzzy.withProbability(0.25)) {
    email = faker.internet.email({
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
    role: () => role,
    position: identity,
    emailAddress: () => email
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
    role: identity,
    position: identity,
    emailAddress: (value, instance) => {
      const name = Person.parseFullName(instance.name)
      return faker.internet.email({
        firstName: name.firstName,
        lastName: name.lastName
      })
    }
  }
}

const _createPerson = async function(user, role, status) {
  const person = Person.filterClientSideFields(new Person())
  populate(person, randomPerson(role, status))
    .name.always()
    .role.always()
    .status.always()
    .rank.always()
    .country.always()
    .gender.always()
    .endOfTourDate.always()
    .biography.always()
    .emailAddress.always()

  console.debug(
    `Creating ${person.gender.toLowerCase().green} ${
      person.role.toLowerCase().green
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
          emailAddress
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
    .emailAddress.rarely()

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
              emailAddress
              endOfTourDate
              gender
              name
              phoneNumber
              rank
              role
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
  return _createPerson(user, args && args.role, args && args.status)
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
