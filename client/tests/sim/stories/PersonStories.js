import { Person } from 'models'
import { runGQL, populate, fuzzy } from '../simutils'
import faker from 'faker'
import firstNames from './afghanFirstNames'
import lastNames from './afghanSurnames'

const personTemplate = {
    name: (instance, context) => {

        return Person.fullName({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        }, true)
    },
    status: () => Person.STATUS.NEW_USER, //faker.random.objectElement(Person.STATUS),
    country: (instance) => instance.country,
    rank: (instance) => instance.rank,
    gender: (instance, context) => (fuzzy.withProbability(.9) ? 'MALE' : 'FEMALE'),
    phoneNumber: () => faker.phone.phoneNumber(),
    endOfTourDate: () => faker.date.future(),
    biography: () => faker.lorem.paragraphs(),
    role: () => faker.random.objectElement(Person.ROLE),
    position: (instance) => instance.position,
    emailAddress: (instance) => {
        const p = Person.parseFullName(instance.name)
        return faker.internet.email(p.firstName, p.lastName)
    }
}

const principalTemplate = {
    name: (instance, context) => {
        const firstName = faker.random.arrayElement(firstNames)
        context.gender = firstName.gender
        return Person.fullName({
            firstName: firstName.name,
            lastName: faker.random.arrayElement(lastNames).name
        }, true)
    },
    status: () => Person.STATUS.ACTIVE,
    country: (instance) => instance.country,
    rank: (instance) => instance.rank,
    gender: (instance, context) => (context.gender === 'm' ? 'MALE' : 'FEMALE'),
    phoneNumber: () => faker.phone.phoneNumber(),
    endOfTourDate: () => faker.date.future(),
    biography: () => faker.lorem.paragraphs(),
    role: () => Person.ROLE.PRINCIPAL,
    position: (instance) => instance.position,
    emailAddress: (instance) => {
        const p = Person.parseFullName(instance.name)
        return faker.internet.email(p.firstName, p.lastName)
    }
}

const createPerson = async function (user) {
    const person = new Person()

    populate(person, principalTemplate)
        .name.withProbability(1)
        .role.withProbability(1)
        .status.withProbability(1)
        .rank.withProbability(1)
        .country.withProbability(1)
        .gender.withProbability(1)
        .endOfTourDate.withProbability(1)
        .biography.withProbability(1)

    console.log(person)
    return await runGQL(user,
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

    populate(person, personTemplate)
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
