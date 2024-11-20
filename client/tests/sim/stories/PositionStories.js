import { faker } from "@faker-js/faker"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Location, Position } from "models"
import { PositionRole } from "models/Position"
import {
  createEmailAddresses,
  createHtmlParagraphs,
  fuzzy,
  getRandomObject,
  identity,
  populate,
  runGQL,
  specialUser
} from "../simutils"

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
          role
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
    const random = faker.number.int({ max: totalCount - 1 })
    organizations = (
      await runGQL(user, {
        query: `
        query ($organizationsQuery: OrganizationSearchQueryInput) {
          organizationList(query: $organizationsQuery) {
            list {
              uuid
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
 * @param organizations The list of organizations to choose from
 */
function randomPositionTemplate(organizations) {
  return {
    type: () => getPositionType(),
    status: () =>
      fuzzy.withProbability(0.9) ? Model.STATUS.ACTIVE : Model.STATUS.INACTIVE,
    person: identity,
    organization: () => faker.helpers.arrayElement(organizations),
    name: () => faker.person.jobTitle(),
    location: identity,
    role: () => getPositionRole(),
    code: identity,
    description: async() => await createHtmlParagraphs(),
    associatedPositions: identity
  }
}

function getPositionType() {
  return fuzzy.withProbability(0.9)
    ? Position.TYPE.REGULAR
    : fuzzy.withProbability(0.9)
      ? Position.TYPE.SUPERUSER
      : Position.TYPE.ADMINISTRATOR
}

function getPositionRole() {
  return fuzzy.withProbability(0.9)
    ? PositionRole.MEMBER.toString()
    : fuzzy.withProbability(0.9)
      ? PositionRole.DEPUTY.toString()
      : PositionRole.LEADER.toString()
}

/**
 * Create a new position for some random (sub)organization
 *
 * @param {*} user The user that creates the position
 */
const _createPosition = async function(user) {
  const position = Position.filterClientSideFields(new Position())
  const code = faker.lorem.slug()
  const organization = await getRandomObject(
    "organizations",
    {},
    "uuid emailAddresses { network address }"
  )
  const person = await getRandomObject(
    "people",
    {},
    "uuid domainUsername",
    randomObject =>
      randomObject?.uuid === user.uuid ||
      randomObject?.domainUsername === specialUser.name
  )
  const location = await getRandomObject("locations", {
    type: Location.LOCATION_TYPES.POINT_LOCATION
  })
  let emailAddresses
  if (fuzzy.withProbability(0.5)) {
    emailAddresses = createEmailAddresses(
      fuzzy.withProbability(0.5),
      `pos_${code}`,
      organization.emailAddresses
    )
  }

  const template = {
    name: () => faker.person.jobTitle(),
    code,
    type: () => getPositionType(),
    status: () =>
      fuzzy.withProbability(0.9) ? Model.STATUS.ACTIVE : Model.STATUS.INACTIVE,
    organization,
    person,
    location,
    role: () => getPositionRole(),
    description: async() => await createHtmlParagraphs(),
    emailAddresses
  }

  const positionGenerator = await populate(position, template)
  await positionGenerator.name.always()
  await positionGenerator.code.sometimes()
  await positionGenerator.type.always()
  await positionGenerator.status.always()
  await positionGenerator.person.always()
  await positionGenerator.organization.always()
  await positionGenerator.location.always()
  await positionGenerator.role.always()
  await positionGenerator.description.always()
  await positionGenerator.emailAddresses.always()

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
        position
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
  const type = Position.TYPE.REGULAR
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
  const type = Position.TYPE.REGULAR
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
          position
        }
      })
    ).data.updatePosition
  } else {
    console.debug(`No INACTIVE ${type.toLowerCase()} position to delete`)
    return "(NOP)"
  }
}

const updatePosition = async function(user) {
  const type = Position.TYPE.REGULAR
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

    const positionGenerator = await populate(
      position,
      randomPositionTemplate(organizations)
    )
    await positionGenerator.name.sometimes()
    await positionGenerator.status.often()
    await positionGenerator.type.never()
    await positionGenerator.organization.rarely()
    await positionGenerator.code.sometimes()

    return (
      await runGQL(user, {
        query: `
        mutation ($position: PositionInput!) {
          updatePosition(position: $position)
        }
      `,
        variables: {
          position
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
          pageSize: 0
        }
      }
    })
  ).data.personList.list.filter(p => !p.position)
  const position = await getRandomPosition(user, {
    isFilled: false,
    type: [Position.TYPE.REGULAR]
  })
  const person = faker.helpers.arrayElement(persons)

  if (!position) {
    console.debug("No positions to fill available")
    return "(nop)"
  } else if (!person) {
    console.debug("No person available to fulfill the position")
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
          type: [Position.TYPE.REGULAR]
        }
      }
    })
  ).data.positionList.list.filter(
    p =>
      p.person &&
      p.person.domainUsername !== specialUser.name &&
      p.type !== Position.TYPE.ADMINISTRATOR
  )
  const position = faker.helpers.arrayElement(positions)

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
 * Associated a random advisor/interlocutor position with a interlocutor/advisor counter-part at roughly the
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
              role
              uuid
            }
          }
        }
      `,
        variables: {
          positionsQuery: {
            pageNum: 0,
            pageSize: 0,
            isFilled: faker.datatype.boolean(),
            type: [type]
          }
        }
      })
    ).data.positionList.list
  }

  // for now just take a random position and do not take the organization level into account
  const interlocutorPosition = faker.helpers.arrayElement(
    listPositions(Position.TYPE.REGULAR)
  )
  const advisorPosition = faker.helpers.arrayElement(
    listPositions(Position.TYPE.REGULAR)
  )

  if (
    interlocutorPosition &&
    advisorPosition &&
    interlocutorPosition.uuid !== advisorPosition.uuid
  ) {
    console.debug(
      `Associating advisor position ${advisorPosition.name.green} with ${interlocutorPosition.name.green}`
    )

    // update the position associations
    advisorPosition.associatedPositions.push({
      uuid: interlocutorPosition.uuid
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
      "Did not find an appropriate interlocutor and/or advisor position"
    )
    return null
  }
}

/**
 * Associate a random advisor/interlocutor position with a interlocutor/advisor counter-part at roughly the
 * same bottom-up-level.
 *
 * @param {*} user The user to do the association
 */
const removeAssociatedPosition = async function(user) {
  const type = Position.TYPE.REGULAR
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
          role
          uuid
        }
      }
    }
  `
  const positions = (
    await runGQL(user, {
      query,
      variables: {
        positionsQuery: {
          pageNum: 0,
          pageSize: 0,
          isFilled: faker.datatype.boolean(),
          type: [type]
        }
      }
    })
  ).data.positionList.list

  // for now just take a random position and do not take the organization level into account
  const position = faker.helpers.arrayElement(
    positions.filter(p => p.associatedPositions && p.associatedPositions.length)
  )

  if (position) {
    const associatedPosition = faker.helpers.arrayElement(
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
          position
        }
      })
    ).data.updateAssociatedPosition
  } else {
    console.debug(
      "Did not find an appropriate interlocutor and/or advisor position"
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
  if (grow) {
    const count = await countPositions(user)
    if (!grow(count)) {
      console.debug(
        `Skipping create position (currently ${count} positions exist)`
      )
      return "(skipped)"
    }
  }
  return _createPosition(user)
}

const deletePosition = async function(user, grow) {
  if (grow) {
    const count = await countPositions(user)
    if (grow(count)) {
      console.debug(
        `Skipping delete position (currently ${count} positions exist)`
      )
      return "(skipped)"
    }
  }
  return _deactivatePosition(user)
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
    positionsQuery.pageNum = faker.number.int({ max: totalCount - 1 })
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
