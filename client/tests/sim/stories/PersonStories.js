import { Person } from 'models'
import { runGQL, populate, fuzzy, identity } from '../simutils'
import faker from 'faker'
import firstNames from './afghanFirstNames'
import lastNames from './afghanSurnames'

const genderFirstNames = firstNames.reduce(
    (result, d) => {
        result[d.gender === 'm' ? 'male' : 'female'] = d
        return result
    },
    { male: [], female: []})


function randomPrincipal() {
    const gender = (fuzzy.withProbability(.9) ? 'MALE' : 'FEMALE')
    const name = {
        firstName: faker.random.arrayElement(
            gender === 'MALE' ? genderFirstNames.male : genderFirstNames.female).name,
        lastName: faker.random.arrayElement(lastNames).name
    }
    return {
        name: () => Person.fullName(name, true),
        status: () => Person.STATUS.ACTIVE,
        country: identity,
        rank: identity,
        gender: () => gender,
        phoneNumber: () => faker.phone.phoneNumber(),
        endOfTourDate: () => faker.date.future(),
        biography: () => faker.lorem.paragraphs(),
        role: () => Person.ROLE.PRINCIPAL,
        position: identity,
        emailAddress: () => faker.internet.email(name.firstName, name.lastName)
    }
}

function modifiedPerson() {
    return {
        name: identity,
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
            return faker.internet.email(name.firstName, name.lastName)
        }
    }
}

const createPerson = async function (user) {
    const person = new Person()

    populate(person, randomPrincipal())
        .name.always()
        .role.always()
        .status.always()
        .rank.always()
        .country.always()
        .gender.always()
        .endOfTourDate.always()
        .biography.always()

    return await runGQL(
        user,
        {
            query: `mutation($person: PersonInput!) { createPerson(person: $person) { uuid } }`,
            variables: { person: person }
        })
}

const updatePerson = async function (user) {

    const people = await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                  list {
                    uuid
                  }
                }
              }
            }`,
            variables: {}
        })
    const person = faker.random.arrayElement(people.data.personList.list)

    populate(person, modifiedPerson())
        .name.seldom()
        .phoneNumber.sometimes()
        .rank.sometimes()
        .country.never()
        .gender.never()
        .endOfTourDate.sometimes()
        .biography.often()
        .emailAddress.seldom()

    const json = await runGQL(user,
        {
            query: `mutation($person: PersonInput!) { updatePerson(person: $person) { uuid } }`,
            variables: { person: person }
        })
}

export { createPerson, updatePerson }
