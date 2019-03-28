import { Person } from 'models'
import { runGQL, populate, fuzzy, identity } from '../simutils'
import faker from 'faker'
import afghanFirstNames from './afghanFirstNames'
import afghanSurnames from './afghanSurnames'

function principalName(_gender) {
    const gender = _gender === 'MALE' ? 'm' : 'f'
    const result = {
        firstName: faker.random.arrayElement(afghanFirstNames.filter((d) => d.gender === gender)).name,
        lastName: faker.random.arrayElement(afghanSurnames).name
    }
    return result
}

function advisorName(gender) {
    const genderInt = (gender === 'MALE' ? 0 : 1)
    return {
        firstName: faker.name.firstName(genderInt),
        lastName: faker.name.lastName(genderInt)
    }
}


function randomPerson(role) {
    const gender = (fuzzy.withProbability(.9) ? 'MALE' : 'FEMALE')
    if (!role) {
        role = faker.random.arrayElement([Person.ROLE.PRINCIPAL, Person.ROLE.ADVISOR])
    }
    const name = (role === Person.ROLE.PRINCIPAL ? principalName : advisorName)(gender)

    return {
        name: () => Person.fullName(name, true),
        status: () => Person.STATUS.ACTIVE,
        country: identity,
        rank: identity,
        gender: () => gender,
        phoneNumber: () => faker.phone.phoneNumber(),
        endOfTourDate: () => faker.date.future(),
        biography: () => faker.lorem.paragraphs(),
        role: () => role,
        position: identity,
        emailAddress: () => faker.internet.email(name.firstName, name.lastName)
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
            return faker.internet.email(name.firstName, name.lastName)
        }
    }
}

const _createPerson = async function (user) {
    const person = new Person()
    populate(person, randomPerson())
        .name.always()
        .role.always()
        .status.always()
        .rank.always()
        .country.always()
        .gender.always()
        .endOfTourDate.always()
        .biography.always()

    console.debug(`Creating ${person.gender.toLowerCase().green} ${person.role.toLowerCase().green} ${person.name.green}`)

    const {firstName, lastName, ...personStripped} = person // TODO: we need to do this more generically
    return await runGQL(
        user,
        {
            query: `mutation($person: PersonInput!) { createPerson(person: $person) { uuid } }`,
            variables: { person: personStripped }
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
            }`,
            variables: {}
        })

    let person = faker.random.arrayElement(people.data.personList.list)
    person = (await runGQL(user,
        {
            query: `query {
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
                }`,
            variables: {}
        })).data.person

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

    const json = await runGQL(user,
        {
            query: `mutation($person: PersonInput!) { updatePerson(person: $person) }`,
            variables: { person: person }
        })
}

const _deletePerson = async function (user) {
    const people = await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                  list {
                    uuid, name,
                    position { uuid }
                  }
                }
              }`,
            variables: {}
        })
    const person0 = faker.random.arrayElement(people.data.personList.list.filter(p => !(p.position && p.position.length)))
    if (person0) {
        const person = (await runGQL(user,
            {
                query: `query {
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
                  }`,
                variables: {}
            })).data.person
        person.status = Person.STATUS.ACTIVE

        console.debug(`Deleting/Deactivating ${person.name.green}`)
        // This should DEACTIVATE a person. Note: only possible if (s)he is removed from position.
        return await runGQL(user,
            {
                query: `mutation($person: PersonInput!) { updatePerson(person: $person) }`,
                variables: { person: person }
            })
        }
    else {
        console.debug(`No person to delete`)
        return null
    }
}

async function countPersons(user) {
    return (await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                    totalCount
                }
            }`,
            variables: {}
        })).data.personList.totalCount
}

const createPerson = async function (user, grow) {
    if (grow) {
        const count = await countPersons(user)
        if (!grow(count)) {
            console.debug(`Skipping delete person (currenty ${count} persons exist)`)
            return '(skipped)'
        }
    }
    return await _createPerson(user)
}

const deletePerson = async function (user, grow) {
    if (grow) {
        const count = await countPersons(user)
        if (grow(count)) {
            console.debug(`Skipping delete person (currenty ${count} persons exist)`)
            return '(skipped)'
        }
    }
    return await _deletePerson(user)
}

export { createPerson, updatePerson, deletePerson }
