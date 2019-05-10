import faker from "faker"
import { Organization, Person, Position } from "models"
import { fuzzy, identity, populate, runGQL, specialUser } from "../simutils"

/**
 * Gets all informative attributes for of a position given its uuid
 *
 * @param {*} user The user to retrieve the information
 * @param {*} uuid The uuid of the position to retrieve
 */
async function getPosition(user, uuid) {
  return (await runGQL(user, {
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
  })).data.position
}

async function listOrganizations(user) {
  const result = await runGQL(user, {
    query: `
      query ($organizationsQuery: OrganizationSearchQueryInput) {
        organizations: organizationList(query: $organizationsQuery) {
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
        pageNum: 0,
        pageSize: 0,
        status: Organization.STATUS.ACTIVE
      }
    }
  })
  if (result.errors) {
    result.errors.forEach(error => console.error(error.message))
  }
  return result.data.organizations.list
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
      fuzzy.withProbability(0.9)
        ? Position.STATUS.ACTIVE
        : Position.STATUS.INACTIVE,
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

/**
 * Create a new position for some random (sub)organization
 *
 * @param {*} user The user that creates the position
 */
const _createPosition = async function(user) {
  const organizations = await listOrganizations(user)
  const position = new Position()

  populate(position, randomPositionTemplate(organizations))
    .name.always()
    .status.always()
    .type.always()
    .organization.always()
    .code.sometimes()

  if (!position.organization) {
    console.debug(
      `Generated position ${
        position.name.green
      } without organization: cannot create`
    )
    return "(nop)"
  }

  console.debug(`Creating position ${position.name.green}`)
  return (await runGQL(user, {
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
  })).data.createPosition
}

/**
 * Remove some random organization.
 *
 * @param {*} user
 */
const _deletePosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  const positions = (await runGQL(user, {
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
      positionsQuery: {
        pageNum: 0,
        pageSize: 0,
        isFilled: false,
        status: Position.STATUS.INACTIVE,
        type: [type]
      }
    }
  })).data.positionList.list
  const position = faker.random.arrayElement(positions)

  if (position) {
    console.debug(`Removing position of ${position.name.green}`)
    return (await runGQL(user, {
      query: `
        mutation($uuid: String!) {
          deletePosition(uuid: $uuid)
        }
      `,
      variables: {
        uuid: position.uuid
      }
    })).data.deletePosition
  } else {
    console.debug(`No INACTIVE ${type.toLowerCase()} position to delete`)
    return "(nop)"
  }
}

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
  const positions = (await runGQL(user, {
    query: `
      query ($positionsQuery: PositionSearchQueryInput) {
        positionList(query: $positionsQuery) {
          list {
            uuid
            name
          }
        }
      }
    `,
    variables: {
      positionsQuery: {
        pageNum: 0,
        pageSize: 0,
        isFilled: false,
        status: Position.STATUS.ACTIVE,
        type: [type]
      }
    }
  })).data.positionList.list
  var position = faker.random.arrayElement(positions)

  if (position) {
    position = (await runGQL(user, {
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
    })).data.position
    position.status = Position.STATUS.INACTIVE

    console.debug(`Removing position of ${position.name.green}`)
    return (await runGQL(user, {
      query: `
        mutation ($position: PositionInput!) {
          updatePosition(position: $position)
        }
      `,
      variables: {
        position: position
      }
    })).data.updatePosition
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
  const positions = (await runGQL(user, {
    query: `
      query ($positionsQuery: PositionSearchQueryInput) {
        positionList(query: $positionsQuery) {
          list {
            uuid
            name
          }
        }
      }
    `,
    variables: {
      positionsQuery: {
        pageNum: 0,
        pageSize: 0,
        isFilled: false,
        type: [type]
      }
    }
  })).data.positionList.list
  const position0 = faker.random.arrayElement(positions)

  if (position0) {
    console.debug(`Updating position of ${position0.name.green}`)

    const organizations = await listOrganizations(user)
    const position = (await runGQL(user, {
      query: `
        query {
          position (uuid:"${position0.uuid}") {
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
    })).data.position

    populate(position, randomPositionTemplate(organizations))
      .name.sometimes()
      .status.often()
      .type.never()
      .organization.rarely()
      .code.sometimes()

    return (await runGQL(user, {
      query: `
        mutation ($position: PositionInput!) {
          updatePosition(position: $position)
        }
      `,
      variables: {
        position: position
      }
    })).data.updatePosition
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
  var persons = (await runGQL(user, {
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
  })).data.personList.list.filter(p => !p.position)
  var positions = (await runGQL(user, {
    query: `
      query ($positionsQuery: PositionSearchQueryInput) {
        positionList(query: $positionsQuery) {
          list {
            uuid
            name
          }
        }
      }
    `,
    variables: {
      positionsQuery: {
        pageNum: 0,
        pageSize: 0,
        isFilled: false,
        type: [type]
      }
    }
  })).data.positionList.list

  var position = faker.random.arrayElement(positions)
  var person = faker.random.arrayElement(persons)

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
    return (await runGQL(user, {
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
    })).data.putPersonInPosition
  }
}

const deletePersonFromPosition = async function(user) {
  const type = faker.random.arrayElement([
    Position.TYPE.ADVISOR,
    Position.TYPE.PRINCIPAL
  ])
  const positions = (await runGQL(user, {
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
  })).data.positionList.list.filter(
    p =>
      p.person &&
      p.person.domainUsername !== specialUser.name &&
      p.type !== Position.TYPE.ADMINISTRATOR
  )
  const position = faker.random.arrayElement(positions)

  if (position) {
    console.debug(
      `Removing ${position.person.name.green} from position of ${
        position.name.green
      }`
    )
    return (await runGQL(user, {
      query: `
        mutation($uuid: String!) {
          deletePersonFromPosition(uuid: $uuid)
        }
      `,
      variables: {
        uuid: position.uuid
      }
    })).data.deletePersonFromPosition
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
    return (await runGQL(user, {
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
    })).data.positionList.list
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
      `Associating advisor position ${advisorPosition.name.green} with ${
        principalPosition.name.green
      }`
    )

    // update the position associations
    advisorPosition.associatedPositions.push({
      uuid: principalPosition.uuid
    })

    return (await runGQL(user, {
      query: `
        mutation($position: PositionInput!) {
          updateAssociatedPosition(position: $position)
        }
      `,
      variables: {
        position: advisorPosition
      }
    })).data.updateAssociatedPosition
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
  const positions = (await runGQL(user, {
    query: query,
    variables: {
      positionsQuery: {
        pageNum: 0,
        pageSize: 0,
        isFilled: faker.random.boolean(),
        type: [type]
      }
    }
  })).data.positionList.list

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

    return (await runGQL(user, {
      query: `
        mutation($position: PositionInput!) {
          updateAssociatedPosition(position: $position)
        }
      `,
      variables: {
        position: position
      }
    })).data.updateAssociatedPosition
  } else {
    console.debug(
      "Did not find an appropriate principal and/or advisor position"
    )
    return null
  }
}

async function countPositions(user) {
  return (await runGQL(user, {
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
  })).data.positionList.totalCount
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

export {
  createPosition,
  updatePosition,
  deletePosition,
  putPersonInPosition,
  deletePersonFromPosition,
  updateAssociatedPosition,
  removeAssociatedPosition
}
