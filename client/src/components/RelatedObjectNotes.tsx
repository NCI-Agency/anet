import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GQL_DELETE_NOTE } from "components/Model"
import RelatedObjectNoteModal from "components/RelatedObjectNoteModal"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import RichTextEditor from "components/RichTextEditor"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { Badge, Button, Card, Col, Offcanvas, Row } from "react-bootstrap"
import Settings from "settings"

interface NotificationBadgeProps {
  pill?: boolean
  bg?: string
  text?: string
  children?: React.ReactNode
}

const NotificationBadge = ({
  pill = true,
  bg = "danger",
  text = "light",
  children
}: NotificationBadgeProps) => (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <Badge
      pill={pill}
      bg={bg}
      text={text}
      style={{
        display: "inline-block",
        position: "absolute",
        top: "-2px",
        right: "-2px",
        textAlign: "center",
        whiteSpace: "nowrap",
        padding: "3px 7px",
        fontSize: "8px",
        marginRight: "-8px",
        marginTop: "-2px"
      }}
    >
      {children}
    </Badge>
  </div>
)

interface RelatedObjectNotesProps {
  notes?: any[]
  relatedObject?: any
}

const RelatedObjectNotes = ({
  relatedObject,
  notes: notesProp = []
}: RelatedObjectNotesProps) => {
  const { currentUser } = useContext(AppContext)
  const { topbarOffset } = useContext(ResponsiveLayoutContext)

  const [error, setError] = useState(null)
  const [showRelatedObjectNoteModalKey, setShowRelatedObjectNoteModalKey] =
    useState(null)
  const [notes, setNotes] = useState(notesProp)
  const [show, setShow] = useState(false)

  const noNotes = _isEmpty(notes)
  const nrNotes = noNotes ? 0 : notes.length
  const maxNotes = 10
  const badgeLabel = nrNotes > maxNotes ? `${maxNotes}+` : nrNotes

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <Button
        onClick={handleShow}
        title="Show notes"
        style={{ display: noNotes ? "inline-block" : "inline-grid" }}
      >
        {!noNotes && <NotificationBadge>{badgeLabel}</NotificationBadge>}
        <Icon icon={IconNames.COMMENT} />
      </Button>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        backdrop={false}
        style={{ zIndex: "1200", marginTop: topbarOffset }}
      >
        <Offcanvas.Header closeButton className="border-top">
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
              onClick={() => showRelatedObjectNoteModal("new")}
            >
              Post a new note
            </Button>
          </div>
          <br />
          <RelatedObjectNoteModal
            note={{
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
              const canEdit = byMe || currentUser.isAdmin()
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
                    <RichTextEditor readOnly value={note.text} />
                  </Card.Body>
                </Card>
              )
            })}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )

  function showRelatedObjectNoteModal(key) {
    setError(null)
    setShowRelatedObjectNoteModalKey(key)
  }

  function cancelRelatedObjectNoteModal() {
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
  }

  function hideNewRelatedObjectNoteModal(note) {
    notes.unshift(note) // add new note at the front
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
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
    setNotes(newNotes)
  }

  function hideDeleteRelatedObjectNoteModal(uuid) {
    setShowRelatedObjectNoteModalKey(null)
    deleteNote(uuid)
  }

  function deleteNote(uuid) {
    const newNotes = notes.filter(item => item.uuid !== uuid) // remove note
    API.mutation(GQL_DELETE_NOTE, { uuid })
      .then(() => {
        setError(null)
        setNotes(newNotes) // remove note
      })
      .catch(setError)
  }
}

export default RelatedObjectNotes
