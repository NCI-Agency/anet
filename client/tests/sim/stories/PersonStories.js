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
    return result;
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

const deletePerson = async function (user) {
    const people = await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                  list {
                    uuid, name,
                    position { uuid }
                  }
                }
              }
            }`,
            variables: {}
        })
    const person = faker.random.arrayElement(people.data.personList.list)
    if (person) {
        console.debug(`Removing ${person.name.green}`)
        return await runGQL(user,
            {
                query: `mutation() { deletePerson(uuid: ${person.uuid}) }`,
                variable: {}
            })
    }
    else {
        return null;
    }
}

const personsBuildup = async function (user, number) {
    var count = (await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                    totalCount
                }
            }`,
            variables: {}
        })).data.personList.totalCount
    for (; count < number; count++) {
        await createPerson(user)
    }

    // TODO: this should actually work in one of the following ways:
    // 
    // --- 1) based on fix frequency and probability of 'success'
    // input parameters user, mean, variance
    // const f = simutils.norm(mean, variance)
    // const p = f(await count(user))
    // if (fuzzy.withProbability(1 - p)) {
    //    await createPerson(user)
    // }
    // --- Note: you'd have to run this at a rate of frequency / f(mean) to get the correct frequency at count===mean
    // --- Also, the frequency will not go any faster than frequency / f(mean)
    // --- This could be 'fixed' by introducing refresh rate (r), i.e. run at r*frequency/f(mean) and use (1-p)/r as
    // --- input for fuzzy.withProbability()
    //
    //
    // --- 1b) Same as above, by provide an accept function that works with the current count as input.
    // --- This separates the probability logic from the story (database) logic
    // function accept(x) {
    //   const f = simutils.norm(mean, variance)
    //   const p = f(x)
    //   return fuzzy.withProbability((1 - p) / r)
    // }
    // input parameters user, accept
    // if (accept(await count(user))) {
    //   await createPerson(user)
    // }
    //
    //
    // --- 2) base delay on frequency at mean and the probability curve of mean an variance
    // input parameters user, mean, variance, frequency (#/s)
    // const f = simutils.norm(mean, variance)
    // var delayS
    // while (true) {
    //   delayS = (f(await count(user)) / f(mean)) / frequency   --- i.e. when count===mean, then delayS=1/frequency
    //   await Aigle.delay(delayS * 1000)
    //   await createPerson(user)
    // }
    // --- Note: this will not be very accurate if count changes a lot during the delay...
    // --- Also, delay will be very constant
    //
    //
}

const createPerson2 = async function (user, accept) {
    var count = (await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                    totalCount
                }
            }`,
            variables: {}
        })).data.personList.totalCount
    if (accept(count)) {
        return await createPerson(user)
    }
    else {
        return '(NOP)'
    }
}

const deletePerson2 = async function (user, accept) {
    var count = (await runGQL(user,
        {
            query: `query {
                personList(query: {pageNum: 0, pageSize: 0, status: ACTIVE}) {
                    totalCount
                }
            }`,
            variables: {}
        })).data.personList.totalCount
    if (accept(count)) {
        return await deletePerson(user)
    }
    else {
        return '(NOP)'
    }
}

export { personsBuildup, createPerson, updatePerson, createPerson2, deletePerson2 }
