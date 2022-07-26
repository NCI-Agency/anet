import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, {
  INVISIBLE_CUSTOM_FIELDS_FIELD,
  NOTE_TYPE
} from "components/Model"
import RelatedObjectNoteModal from "components/RelatedObjectNoteModal"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useEffect, useRef, useState } from "react"
import { Button, Card, Col, Offcanvas, Row } from "react-bootstrap"
import NotificationBadge from "react-notification-badge"
import Settings from "settings"
import utils from "utils"
import "./BlueprintOverrides.css"

const GQL_DELETE_NOTE = gql`
  mutation ($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

export { GRAPHQL_NOTES_FIELDS } from "components/Model"

export const EXCLUDED_ASSESSMENT_FIELDS = [
  "__recurrence",
  "__periodStart",
  "__relatedObjectType",
  INVISIBLE_CUSTOM_FIELDS_FIELD
]

const EXCLUDED_NOTE_TYPES = [NOTE_TYPE.ASSESSMENT, NOTE_TYPE.PARTNER_ASSESSMENT]

const RelatedObjectNotes = ({
  notesElemId,
  relatedObject,
  notes: notesProp
}) => {
  const { currentUser } = useContext(AppContext)
  const { topbarOffset } = useContext(ResponsiveLayoutContext)
  const notesFiltered = notesProp.filter(
    note => !EXCLUDED_NOTE_TYPES.includes(note.type)
  )
  const latestNotesProp = useRef(notesFiltered)
  const notesPropUnchanged = _isEqualWith(
    latestNotesProp.current,
    notesFiltered,
    utils.treatFunctionsAsEqual
  )

  const [error, setError] = useState(null)
  const [showRelatedObjectNoteModalKey, setShowRelatedObjectNoteModalKey] =
    useState(null)
  const [noteType, setNoteType] = useState(null)
  const [notes, setNotes] = useState(notesFiltered)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!notesPropUnchanged) {
      latestNotesProp.current = notesFiltered
      setError(null)
      setNotes(notesFiltered)
    }
  }, [notesPropUnchanged, notesFiltered])

  const noNotes = _isEmpty(notes)
  const nrNotes = noNotes ? 0 : notes.length
  const badgeLabel = nrNotes > 10 ? "10+" : null

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <Button onClick={handleShow} title="Show notes">
        <NotificationBadge
          count={nrNotes}
          label={badgeLabel}
          style={{ fontSize: "8px", marginRight: "-8px", marginTop: "-2px" }}
          effect={["none", "none"]}
        />
        <Icon icon={IconNames.COMMENT} />
      </Button>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        backdrop={false}
        style={{ zIndex: "1200", marginTop: topbarOffset }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Notes</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Messages error={error} />
          <br />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexWrap: "wrap",
              justifyContent: "space-evenly",
              width: "100%"
            }}
          >
            <Button
              variant="primary"
              style={{ margin: "5px" }}
              onClick={() =>
                showRelatedObjectNoteModal("new", NOTE_TYPE.FREE_TEXT)
              }
            >
              Post a new note
            </Button>
          </div>
          <br />
          <RelatedObjectNoteModal
            note={{
              type: noteType,
              noteRelatedObjects: [{ ...relatedObject }]
            }}
            currentObject={relatedObject}
            showModal={showRelatedObjectNoteModalKey === "new"}
            onCancel={cancelRelatedObjectNoteModal}
            onSuccess={hideNewRelatedObjectNoteModal}
          />
          {noNotes && (
            <div>
              <i>No notes</i>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column"
            }}
          >
            {notes.map(note => {
              const updatedAt = moment(note.updatedAt).format(
                Settings.dateFormats.forms.displayShort.withTime
              )
              const byMe = Person.isEqual(currentUser, note.author)
              const canEdit =
                note.type !== NOTE_TYPE.PARTNER_ASSESSMENT &&
                note.type !== NOTE_TYPE.ASSESSMENT &&
                (byMe || currentUser.isAdmin())
              const isJson = note.type !== NOTE_TYPE.FREE_TEXT
              const jsonFields =
                isJson && note.text ? utils.parseJsonSafe(note.text) : {}
              const noteText = isJson
                ? jsonFields.text
                : parseHtmlWithLinkTo(note.text)
              return (
                <Card
                  key={note.uuid}
                  variant="primary"
                  style={{ marginBottom: "1rem" }}
                >
                  <Card.Header>
                    <Row>
                      <Col xs={8}>
                        <Row>
                          <small>
                            <i>{updatedAt}</i>{" "}
                          </small>
                        </Row>
                        <Row>
                          <LinkTo modelType="Person" model={note.author} />
                        </Row>
                      </Col>
                      <Col xs={4} className="text-end">
                        {canEdit && (
                          <>
                            <Button
                              title="Edit note"
                              onClick={() =>
                                showRelatedObjectNoteModal(note.uuid)
                              }
                              size="xs"
                              variant="outline-secondary"
                            >
                              <Icon icon={IconNames.EDIT} />
                            </Button>

                            <RelatedObjectNoteModal
                              note={note}
                              currentObject={relatedObject}
                              showModal={
                                showRelatedObjectNoteModalKey === note.uuid
                              }
                              onCancel={cancelRelatedObjectNoteModal}
                              onSuccess={hideEditRelatedObjectNoteModal}
                              onDelete={hideDeleteRelatedObjectNoteModal}
                            />
                            <span style={{ marginLeft: "5px" }}>
                              <ConfirmDestructive
                                onConfirm={() => deleteNote(note.uuid)}
                                objectType="note"
                                objectDisplay={"#" + note.uuid}
                                title="Delete note"
                                variant="outline-danger"
                                buttonSize="xs"
                              >
                                <Icon icon={IconNames.TRASH} />
                              </ConfirmDestructive>
                            </span>
                          </>
                        )}
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body>
                    <div
                      style={{
                        overflowWrap: "break-word",
                        /* IE: */ wordWrap: "break-word"
                      }}
                    >
                      {note.type === NOTE_TYPE.CHANGE_RECORD &&
                        (jsonFields.oldValue === jsonFields.newValue ? (
                          <span>
                            Field <b>{jsonFields.changedField}</b> was unchanged
                            (<em>'{jsonFields.oldValue}'</em>):
                          </span>
                        ) : (
                          <span>
                            Field <b>{jsonFields.changedField}</b> was changed
                            from <em>'{jsonFields.oldValue}'</em> to{" "}
                            <em>'{jsonFields.newValue}'</em>:
                          </span>
                        ))}
                    </div>
                    <div
                      style={{
                        overflowWrap: "break-word",
                        wordWrap: "break-word" // IE
                      }}
                    >
                      {noteText}
                    </div>
                  </Card.Body>
                </Card>
              )
            })}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )

  function showRelatedObjectNoteModal(key, type) {
    setError(null)
    setShowRelatedObjectNoteModalKey(key)
    setNoteType(type)
  }

  function cancelRelatedObjectNoteModal() {
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
    setNoteType(null)
  }

  function hideNewRelatedObjectNoteModal(note) {
    notes.unshift(note) // add new note at the front
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
    setNoteType(null)
    setNotes(notes)
  }

  function hideEditRelatedObjectNoteModal(note) {
    const newNotes = notes.filter(item => item.uuid !== note.uuid) // remove old note
    const roUuids = note?.noteRelatedObjects.map(nro => nro.relatedObjectUuid)
    if (roUuids?.includes(relatedObject?.relatedObjectUuid)) {
      newNotes.unshift(note) // add updated note at the front
    }
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
    setNoteType(null)
    setNotes(newNotes)
  }

  function hideDeleteRelatedObjectNoteModal(uuid) {
    setShowRelatedObjectNoteModalKey(null)
    deleteNote(uuid)
  }

  function deleteNote(uuid) {
    const newNotes = notes.filter(item => item.uuid !== uuid) // remove note
    API.mutation(GQL_DELETE_NOTE, { uuid })
      .then(data => {
        setError(null)
        setNotes(newNotes) // remove note
      })
      .catch(error => {
        setError(error)
      })
  }
}
RelatedObjectNotes.propTypes = {
  notesElemId: PropTypes.string.isRequired,
  notes: PropTypes.arrayOf(Model.notePropType),
  relatedObject: Model.relatedObjectPropType
}
RelatedObjectNotes.defaultProps = {
  notesElemId: "notes-view",
  notes: []
}

export default RelatedObjectNotes
