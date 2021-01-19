import Model from "components/Model"
import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import { Organization, Person, Position } from "models"
import { fuzzy, identity, populate, runGQL, specialUser } from "../simutils"
import { getRandomObject } from "./NoteStories"

/**
 * Gets all informative attributes for of a position given its uuid
 *
 * @param {*} user The user to retrieve the information
 * @param {*} uuid The uuid of the position to retrieve
 */
/* eslint-disable no-unused-vars */
async function getPosition(user, uuid) {
  return (
    await runGQL(user, {
      query: `
      query {
        position(uuid: "${uuid}") {
          uuid
          name
          type
          status
          code
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
          person {
            uuid
            name
            rank
          }
          associatedPositions {
            uuid
            name
            person {
              uuid
              name
              rank
            }
            organization {
              uuid
              shortName
            }
          }
          previousPeople {
            startTime
            endTime
            person {
              uuid
              name
              rank
            }
          }
          location {
            uuid
            name
          }
        }
      }
    `,
      variables: {}
    })
  ).data.position
}
/* eslint-enable no-unused-vars */

async function listOrganizations(user) {
  const totalCount = (
    await runGQL(user, {
      query: `
      query ($organizationsQuery: OrganizationSearchQueryInput) {
        organizationList(query: $organizationsQuery) {
          totalCount
        }
      }
    `,
      variables: {
        organizationsQuery: {
          pageNum: 0,
          pageSize: 1,
          status: Model.STATUS.ACTIVE
        }
      }
    })
  ).data.organizationList.totalCount
  let organizations = null
  if (totalCount > 0) {
    const random = faker.random.number({ max: totalCount - 1 })
    organizations = (
      await runGQL(user, {
        query: `
        query ($organizationsQuery: OrganizationSearchQueryInput) {
          organizationList(query: $organizationsQuery) {
            list {
              uuid
              type
              shortName
            }
          }
        }
      `,
        variables: {
          organizationsQuery: {
            pageNum: random,
            pageSize: 1,
            status: Model.STATUS.ACTIVE
          }
        }
      })
    ).data.organizationList.list
  }
  return organizations
}

/**
 * Creates a template to fill a position with random data
 *
 * @param {{uuid,*}} organizations The list of organizations to choose from
 */
function randomPositionTemplate(organizations) {
  // ensure organization type and position type are in line
  const orgType = faker.random.objectElement(Organization.TYPE)
  return {
    type: () => {
      if (orgType === Organization.TYPE.ADVISOR_ORG) {
        const rand = Math.random()
        if (rand < 0.9) {
          return Position.TYPE.ADVISOR
        } else if (rand < 0.99) {
          return Position.TYPE.SUPER_USER
        } else {
          return Position.TYPE.ADMINISTRATOR
        }
      } else {
        return Position.TYPE.PRINCIPAL
      }
    },
    status: () =>
      fuzzy.withProbability(0.9) ? Model.STATUS.ACTIVE : Model.STATUS.INACTIVE,
    person: identity,
    organization: () => {
      return faker.random.arrayElement(
        organizations.filter(o => o.type === orgType)
      )
    },
    name: () => faker.name.jobTitle(),
    location: identity,
    code: identity,
    associatedPositions: identity
  }
}

function getPersonRole(organizationType) {
  return organizationType === Organization.TYPE.ADVISOR_ORG
    ? Person.ROLE.ADVISOR
    : Person.ROLE.PRINCIPAL
}

function getPositionType(organizationType) {
  if (organizationType === Organization.TYPE.ADVISOR_ORG) {
    const rand = Math.random()
    if (rand < 0.9) {
      return Position.TYPE.ADVISOR
    } else if (rand < 0.99) {
      return Position.TYPE.SUPER_USER
    } else {
      return Position.TYPE.ADMINISTRATOR
    }
  } else {
    return Position.TYPE.PRINCIPAL
  }
}

/**
 * Create a new position for some random (sub)organization
 *
 * @param {*} user The user that creates the position
 */
const _createPosition = async function(user) {
  const position = Object.without(new Position(), "formCustomFields")
  const organization = await getRandomObject(
    user,
    "organizations",
    {},
    "uuid type"
  )
  const person = await getRandomObject(
    user,
    "people",
    {
      role: getPersonRole(organization.type)
    },
    "uuid domainUsername",
    randomObject =>
      randomObject?.uuid === user.uuid ||
      randomObject?.domainUsername === specialUser.name
  )
  const location = await getRandomObject(user, "locations")
  const template = {
    name: () => faker.name.jobTitle(),
    code: () => faker.lorem.slug(),
    type: () => getPositionType(organization.type),
    status: () =>
      fuzzy.withProbability(0.9) ? Model.STATUS.ACTIVE : Model.STATUS.INACTIVE,
    organization,
    person,
    location
  }

  populate(position, template)
    .name.always()
    .code.sometimes()
    .type.always()
    .status.always()
    .person.always()
    .organization.always()
    .location.always()

  console.debug(`Creating position ${position.name.green}`)
  return (
    await runGQL(user, {
      query: `
      mutation ($position: PositionInput!) {
        createPosition(position: $position) {
          uuid
        }
      }
    `,
      variables: {
        position: position
      }
    })
  ).data.createPosition
}

/**
 * Remove some random organization.
 *
 * @param {*} user
 */
/* eslint-disable no-unused-vars */
const _deletePosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  const position = await getRandomPosition(user, {
    isFilled: false,
    status: Model.STATUS.INACTIVE,
    type: [type]
  })

  if (position) {
    console.debug(`Removing position of ${position.name.green}`)
    return (
      await runGQL(user, {
        query: `
        mutation($uuid: String!) {
          deletePosition(uuid: $uuid)
        }
      `,
        variables: {
          uuid: position.uuid
        }
      })
    ).data.deletePosition
  } else {
    console.debug(`No INACTIVE ${type.toLowerCase()} position to delete`)
    return "(nop)"
  }
}
/* eslint-enable no-unused-vars */

/**
 * Remove some random organization.
 *
 * @param {*} user
 */
const _deactivatePosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  let position = await getRandomPosition(user, {
    isFilled: false,
    status: Model.STATUS.ACTIVE,
    type: [type]
  })

  if (position) {
    position = (
      await runGQL(user, {
        query: `
        query {
          position (uuid:"${position.uuid}") {
            uuid
            name
            code
            status
            type
            location {
              uuid
            }
            associatedPositions {
              uuid
              name
              person {
                uuid
                name
                rank
              }
            }
            organization {
              uuid
            }
            person {
              uuid
            }
          }
        }
      `,
        variables: {}
      })
    ).data.position
    position.status = Model.STATUS.INACTIVE

    console.debug(`Removing position of ${position.name.green}`)
    return (
      await runGQL(user, {
        query: `
        mutation ($position: PositionInput!) {
          updatePosition(position: $position)
        }
      `,
        variables: {
          position: position
        }
      })
    ).data.updatePosition
  } else {
    console.debug(`No INACTIVE ${type.toLowerCase()} position to delete`)
    return "(NOP)"
  }
}

const updatePosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  let position = await getRandomPosition(user, {
    isFilled: false,
    type: [type]
  })

  if (position) {
    console.debug(`Updating position of ${position.name.green}`)

    const organizations = await listOrganizations(user)
    position = (
      await runGQL(user, {
        query: `
        query {
          position (uuid:"${position.uuid}") {
            uuid
            name
            code
            status
            type
            location {
              uuid
            }
            associatedPositions {
              uuid
              name
              person {
                uuid
                name
                rank
              }
            }
            organization {
              uuid
            }
            person {
              uuid
            }
          }
        }
      `,
        variables: {}
      })
    ).data.position

    populate(position, randomPositionTemplate(organizations))
      .name.sometimes()
      .status.often()
      .type.never()
      .organization.rarely()
      .code.sometimes()

    return (
      await runGQL(user, {
        query: `
        mutation ($position: PositionInput!) {
          updatePosition(position: $position)
        }
      `,
        variables: {
          position: position
        }
      })
    ).data.updatePosition
  } else {
    console.debug("No position to update")
    return "(nop)"
  }
}

/**
 * Assign a random (free) person to a random (free) position
 *
 * @param {*} user  The user to do the assignment
 */
const putPersonInPosition = async function(user) {
  const role = faker.random.objectElement(Person.ROLE)
  const type =
    role === Person.ROLE.ADVISOR
      ? Position.TYPE.ADVISOR
      : Position.TYPE.PRINCIPAL
  const persons = (
    await runGQL(user, {
      query: `
      query ($peopleQuery: PersonSearchQueryInput) {
        personList(query: $peopleQuery) {
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
      variables: {
        peopleQuery: {
          pageNum: 0,
          pageSize: 0,
          role: role
        }
      }
    })
  ).data.personList.list.filter(p => !p.position)
  const position = await getRandomPosition(user, {
    isFilled: false,
    type: [type]
  })
  const person = faker.random.arrayElement(persons)

  if (!position) {
    console.debug("No positions to fill available")
    return "(nop)"
  } else if (!person) {
    console.debug("No person available to fullfill the position")
    return "(nop)"
  } else {
    console.debug(
      `Putting ${person.name.green} in position of ${position.name.green}`
    )
    return (
      await runGQL(user, {
        query: `
        mutation($uuid: String!, $person: PersonInput!) {
          putPersonInPosition(uuid: $uuid, person: $person)
        }
      `,
        variables: {
          person: {
            uuid: person.uuid
          },
          uuid: position.uuid
        }
      })
    ).data.putPersonInPosition
  }
}

const deletePersonFromPosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  const positions = (
    await runGQL(user, {
      query: `
      query ($positionsQuery: PositionSearchQueryInput) {
        positionList(query: $positionsQuery) {
          list {
            uuid
            name
            type
            person {
              domainUsername
              name
            }
          }
        }
      }
    `,
      variables: {
        positionsQuery: {
          pageNum: 0,
          pageSize: 0,
          isFilled: true,
          type: [type]
        }
      }
    })
  ).data.positionList.list.filter(
    p =>
      p.person &&
      p.person.domainUsername !== specialUser.name &&
      p.type !== Position.TYPE.ADMINISTRATOR
  )
  const position = faker.random.arrayElement(positions)

  if (position) {
    console.debug(
      `Removing ${position.person.name.green} from position of ${position.name.green}`
    )
    return (
      await runGQL(user, {
        query: `
        mutation($uuid: String!) {
          deletePersonFromPosition(uuid: $uuid)
        }
      `,
        variables: {
          uuid: position.uuid
        }
      })
    ).data.deletePersonFromPosition
  } else {
    console.debug("No position")
    return "(NOP)"
  }
}

/**
 * Associated a random advisor/principal position with a principal/advisor counter-part at roughly the
 * same bottom-up-level.
 *
 * @param {*} user The user to do the association
 */
const updateAssociatedPosition = async function(user) {
  async function listPositions(type) {
    return (
      await runGQL(user, {
        query: `
        query ($positionsQuery: PositionSearchQueryInput) {
          positionList(query: $positionsQuery) {
            list {
              associatedPositions {
                uuid
              }
              code
              name
              organization {
                uuid
                shortName
                longName
                identificationCode
              }
              status
              type
              uuid
            }
          }
        }
      `,
        variables: {
          positionsQuery: {
            pageNum: 0,
            pageSize: 0,
            isFilled: faker.random.boolean(),
            type: [type]
          }
        }
      })
    ).data.positionList.list
  }

  // for now just take a random position and do not take the organization level into account
  const principalPosition = faker.random.arrayElement(
    listPositions(Position.TYPE.PRINCIPAL)
  )
  const advisorPosition = faker.random.arrayElement(
    listPositions(Position.TYPE.ADVISOR)
  )

  if (principalPosition && advisorPosition) {
    console.debug(
      `Associating advisor position ${advisorPosition.name.green} with ${principalPosition.name.green}`
    )

    // update the position associations
    advisorPosition.associatedPositions.push({
      uuid: principalPosition.uuid
    })

    return (
      await runGQL(user, {
        query: `
        mutation($position: PositionInput!) {
          updateAssociatedPosition(position: $position)
        }
      `,
        variables: {
          position: advisorPosition
        }
      })
    ).data.updateAssociatedPosition
  } else {
    console.debug(
      "Did not find an appropriate principal and/or advisor position"
    )
    return null
  }
}

/**
 * Associate a random advisor/principal position with a principal/advisor counter-part at roughly the
 * same bottom-up-level.
 *
 * @param {*} user The user to do the association
 */
const removeAssociatedPosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  const query = `
    query ($positionsQuery: PositionSearchQueryInput) {
      positionList(query: $positionsQuery) {
        list {
          associatedPositions {
            uuid
            name
          }
          code
          name
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
          status
          type
          uuid
        }
      }
    }
  `
  const positions = (
    await runGQL(user, {
      query: query,
      variables: {
        positionsQuery: {
          pageNum: 0,
          pageSize: 0,
          isFilled: faker.random.boolean(),
          type: [type]
        }
      }
    })
  ).data.positionList.list

  // for now just take a random position and do not take the organization level into account
  const position = faker.random.arrayElement(
    positions.filter(p => p.associatedPositions && p.associatedPositions.length)
  )

  if (position) {
    const associatedPosition = faker.random.arrayElement(
      position.associatedPositions
    )
    const index = position.associatedPositions.indexOf(associatedPosition)

    console.debug(
      `Disassociating position ${
        associatedPosition.name.green
      } from ${position.type.toLowerCase()} position ${position.name.green}`
    )

    // update the position associations
    position.associatedPositions.splice(index, 1)

    return (
      await runGQL(user, {
        query: `
        mutation($position: PositionInput!) {
          updateAssociatedPosition(position: $position)
        }
      `,
        variables: {
          position: position
        }
      })
    ).data.updateAssociatedPosition
  } else {
    console.debug(
      "Did not find an appropriate principal and/or advisor position"
    )
    return null
  }
}

async function countPositions(user) {
  return (
    await runGQL(user, {
      query: `
      query {
        positionList(query: {
          pageNum: 0,
          pageSize: 1
        }) {
          totalCount
        }
      }
    `,
      variables: {}
    })
  ).data.positionList.totalCount
}

const createPosition = async function(user, grow) {
  const count = await countPositions(user)
  if (grow(count)) {
    return _createPosition(user)
  } else {
    console.debug("Skipping create position")
    return "(skipped)"
  }
}

const deletePosition = async function(user, grow) {
  const count = await countPositions(user)
  if (!grow(count)) {
    return _deactivatePosition(user)
  } else {
    console.debug("Skipping delete position")
    return "(skipped)"
  }
}

async function getRandomPosition(user, variables) {
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
  let positions = null
  if (totalCount > 0) {
    positionsQuery.pageNum = faker.random.number({ max: totalCount - 1 })
    positions = (
      await runGQL(user, {
        query: `
        query ($positionsQuery: PositionSearchQueryInput) {
          positionList(query: $positionsQuery) {
            list {
              uuid,
              name
            }
          }
        }
      `,
        variables: {
          positionsQuery
        }
      })
    ).data.positionList.list
  }
  return _isEmpty(positions) ? null : positions[0]
}

export {
  createPosition,
  updatePosition,
  deletePosition,
  putPersonInPosition,
  deletePersonFromPosition,
  updateAssociatedPosition,
  removeAssociatedPosition
}
