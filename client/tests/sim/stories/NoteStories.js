import { NOTE_TYPE } from "components/Model"
import faker from "faker"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import { populate, runGQL } from "../simutils"

function getListEndpoint(type) {
  switch (type) {
    case "authorizationGroups":
      return ["authorizationGroupList", "AuthorizationGroupSearchQueryInput"]
    case "locations":
      return ["locationList", "LocationSearchQueryInput"]
    case "organizations":
      return ["organizationList", "OrganizationSearchQueryInput"]
    case "people":
      return ["personList", "PersonSearchQueryInput"]
    case "positions":
      return ["positionList", "PositionSearchQueryInput"]
    case "reports":
      return ["reportList", "ReportSearchQueryInput"]
    case "tasks":
      return ["taskList", "TaskSearchQueryInput"]
    default:
      return null
  }
}

export async function getRandomObject(
  user,
  type,
  variables,
  fields = "uuid",
  ignoredUuids = []
) {
  const [listEndpoint, queryType] = getListEndpoint(type)
  const objectQuery = Object.assign({}, variables, {
    pageNum: 0,
    pageSize: 1
  })
  const totalCount = (
    await runGQL(user, {
      query: `
      query ($objectQuery: ${queryType}) {
        ${listEndpoint}(query: $objectQuery) {
          totalCount
        }
      }
    `,
      variables: {
        objectQuery
      }
    })
  ).data[listEndpoint].totalCount
  if (totalCount === 0) {
    return null
  }
  let attempt = 0
  while (attempt < 10) {
    objectQuery.pageNum = faker.random.number({ max: totalCount - 1 })
    const list = (
      await runGQL(user, {
        query: `
          query ($objectQuery: ${queryType}) {
            ${listEndpoint}(query: $objectQuery) {
              list {
                ${fields}
              }
            }
          }
        `,
        variables: {
          objectQuery
        }
      })
    ).data[listEndpoint].list
    if (_isEmpty(list)) {
      return null
    }
    const randomObject = list[0]
    if (ignoredUuids.includes(randomObject?.uuid)) {
      attempt++
    } else {
      return randomObject
    }
  }
  return null
}

async function populateNote(note, user, relatedObjectType) {
  const obj = await getRandomObject(user, relatedObjectType)
  const relatedObject =
    obj && obj.uuid ? { relatedObjectType, relatedObjectUuid: obj.uuid } : null
  const author = await getRandomObject(user, "people", {
    role: Person.ROLE.ADVISOR
  })
  const template = {
    author: () => author,
    type: () => NOTE_TYPE.FREE_TEXT,
    noteRelatedObjects: () => [relatedObject],
    text: () => faker.lorem.paragraphs()
  }
  populate(note, template)
    .author.always()
    .type.always()
    .noteRelatedObjects.always()
    .text.always()
  return note
}

const _createNote = async function(user, relatedObjectType) {
  const note = {}
  if (await populateNote(note, user, relatedObjectType)) {
    console.debug(
      `Creating ${
        NOTE_TYPE.FREE_TEXT.toLowerCase().green
      } ${relatedObjectType} note`
    )

    return (
      await runGQL(user, {
        query:
          "mutation($note: NoteInput!) { createNote(note: $note) { uuid } }",
        variables: { note }
      })
    ).data.createNote
  }
}

const createNote = async function(user, grow, args) {
  return _createNote(user, args && args.relatedObjectType)
}

export { createNote }
