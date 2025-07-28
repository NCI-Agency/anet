import {
  createHtmlParagraphs,
  getRandomObject,
  populate,
  runGQL
} from "../simutils"

async function populateNote(note, relatedObjectType) {
  const obj = await getRandomObject(relatedObjectType)
  const relatedObject =
    obj && obj.uuid ? { relatedObjectType, relatedObjectUuid: obj.uuid } : null
  const author = await getRandomObject("people")
  const template = {
    author: () => author,
    noteRelatedObjects: () => [relatedObject],
    text: async () => await createHtmlParagraphs()
  }
  const noteGenerator = await populate(note, template)
  await noteGenerator.author.always()
  await noteGenerator.noteRelatedObjects.always()
  await noteGenerator.text.always()
  return note
}

const _createNote = async function (user, relatedObjectType) {
  const note = {}
  if (await populateNote(note, relatedObjectType)) {
    console.debug(`Creating ${relatedObjectType} note`)

    return (
      await runGQL(user, {
        query:
          "mutation($note: NoteInput!) { createNote(note: $note) { uuid } }",
        variables: { note }
      })
    ).data.createNote
  }
}

const createNote = async function (user, grow, args) {
  return _createNote(user, args && args.relatedObjectType)
}

export { createNote }
