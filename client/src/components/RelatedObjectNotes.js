import API, { Settings } from "api"
import { gql } from "apollo-boost"
import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import Pie from "components/graphs/Pie"
import LinkTo from "components/LinkTo"
import Model, { NOTE_TYPE } from "components/Model"
import RelatedObjectNoteModal from "components/RelatedObjectNoteModal"
import { JSONPath } from "jsonpath-plus"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Button, Panel } from "react-bootstrap"
import ReactDOM from "react-dom"
import NotificationBadge from "react-notification-badge"
import REMOVE_ICON from "resources/delete.png"
import { parseHtmlWithLinkTo } from "utils_links"
import "./BlueprintOverrides.css"
import utils from "utils"

const GQL_DELETE_NOTE = gql`
  mutation($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

export { GRAPHQL_NOTES_FIELDS } from "components/Model"

const BaseRelatedObjectNotes = ({
  currentUser,
  notesElemId,
  relatedObject,
  relatedObjectValue,
  notes: notesProp
}) => {
  const latestNotesProp = useRef(notesProp)
  const notesPropUnchanged = _isEqualWith(
    latestNotesProp.current,
    notesProp,
    utils.treatFunctionsAsEqual
  )

  // TODO: display somewhere the error state
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null) // lgtm[js/unused-local-variable]
  const [hidden, setHidden] = useState(true)
  const [
    showRelatedObjectNoteModalKey,
    setShowRelatedObjectNoteModalKey
  ] = useState(null)
  const [noteType, setNoteType] = useState(null)
  const [notes, setNotes] = useState(notesProp)

  const notesElem = document.getElementById(notesElemId)

  useEffect(() => {
    if (!notesPropUnchanged) {
      latestNotesProp.current = notesProp
      setError(null)
      setNotes(notesProp)
    }
  }, [notesPropUnchanged, notesProp])

  const renderPortal = () => {
    const noNotes = _isEmpty(notes)
    const nrNotes = noNotes ? 0 : notes.length
    const badgeLabel = nrNotes > 10 ? "10+" : null
    const questions =
      relatedObject &&
      Settings.fields.principal.person.assessment &&
      relatedObject.relatedObjectType === "people" &&
      relatedObjectValue.role === Person.ROLE.PRINCIPAL
        ? Settings.fields.principal.person.assessment.questions.filter(
          question =>
            !question.test ||
              !_isEmpty(JSONPath(question.test, relatedObjectValue))
        )
        : []
    const partnerAssessments = notes.filter(
      note => note.type === NOTE_TYPE.PARTNER_ASSESSMENT
    )
    const partnerAssessmentsSummary = partnerAssessments.reduce(
      (counters, assessment) => {
        const assessmentJson = JSON.parse(assessment.text)

        questions.forEach(question => {
          if (!counters[question.id]) counters[question.id] = {}
          const counter = counters[question.id]
          if (assessmentJson[question.id]) {
            counter[assessmentJson[question.id]] =
              ++counter[assessmentJson[question.id]] || 1
          }
        })
        return counters
      },
      {}
    )

    return hidden ? (
      <div style={{ minWidth: 50, padding: 5, marginRight: 15 }}>
        <NotificationBadge
          count={nrNotes}
          label={badgeLabel}
          style={{ fontSize: "8px", padding: 4 }}
          effect={["none", "none"]}
        />
        <Button bsSize="small" onClick={toggleHidden} title="Show notes">
          <Icon icon={IconNames.COMMENT} />
        </Button>
      </div>
    ) : (
      <div
        style={{
          flexDirection: "column",
          alignItems: "flex-end",
          padding: 5,
          height: "100%",
          overflowX: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            padding: 5
          }}
        >
          <h4 style={{ paddingRight: 5 }}>Notes</h4>
          <Button bsSize="small" onClick={toggleHidden} title="hidden notes">
            <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
          </Button>
        </div>
        <br />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-evenly",
            width: "100%"
          }}
        >
          <Button
            bsStyle="primary"
            style={{ margin: "5px" }}
            onClick={() =>
              showRelatedObjectNoteModal("new", NOTE_TYPE.FREE_TEXT)}
          >
            Post new note
          </Button>
          {questions.length > 0 && (
            <Button
              bsStyle="primary"
              style={{ margin: "5px" }}
              onClick={() =>
                showRelatedObjectNoteModal("new", NOTE_TYPE.PARTNER_ASSESSMENT)}
            >
              Assess Person
            </Button>
          )}
        </div>
        <br />
        <RelatedObjectNoteModal
          note={{
            type: noteType,
            noteRelatedObjects: [{ ...relatedObject }]
          }}
          questions={questions}
          showModal={showRelatedObjectNoteModalKey === "new"}
          onCancel={cancelRelatedObjectNoteModal}
          onSuccess={hideNewRelatedObjectNoteModal}
        />
        {noNotes && (
          <div>
            <i>No notes</i>
          </div>
        )}

        {partnerAssessments.length > 0 && questions.length > 0 && (
          <Panel bsStyle="primary" style={{ width: "100%" }}>
            <Panel.Heading>
              Summary of <b>{partnerAssessments.length}</b> assessments for{" "}
              {relatedObjectValue.rank} {relatedObjectValue.name}
            </Panel.Heading>
            <Panel.Body>
              {questions.map(question => (
                <React.Fragment key={question.id}>
                  {question.label}
                  <br />
                  <Pie
                    width={70}
                    height={70}
                    data={partnerAssessmentsSummary[question.id]}
                    label={Object.values(
                      partnerAssessmentsSummary[question.id]
                    ).reduce((acc, cur) => acc + cur, 0)}
                    segmentFill={entity => {
                      const matching = question.choice.filter(
                        choice => choice.value === entity.data.key
                      )
                      return matching.length > 0 ? matching[0].color : "#bbbbbb"
                    }}
                    segmentLabel={d => d.data.value}
                  />

                  <br />
                  {question.choice.map(choice => (
                    <React.Fragment key={choice.value}>
                      <span style={{ backgroundColor: choice.color }}>
                        {choice.label} :
                        <b>
                          {partnerAssessmentsSummary[question.id][choice.value]}
                        </b>{" "}
                      </span>
                    </React.Fragment>
                  ))}
                  <br />
                  <br />
                </React.Fragment>
              ))}
            </Panel.Body>
          </Panel>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column"
          }}
        >
          {notes.map(note => {
            const updatedAt = moment(note.updatedAt).fromNow()
            const byMe = Person.isEqual(currentUser, note.author)
            const canEdit =
              note.type !== NOTE_TYPE.ASSESSMENT &&
              (byMe || currentUser.isAdmin())
            const isJson = note.type !== NOTE_TYPE.FREE_TEXT
            const jsonFields = isJson && note.text ? JSON.parse(note.text) : {}
            const noteText = isJson
              ? jsonFields.text
              : parseHtmlWithLinkTo(note.text)
            return (
              <Panel
                key={note.uuid}
                bsStyle="primary"
                style={{ borderRadius: "15px" }}
              >
                <Panel.Heading
                  style={{
                    padding: "1px 1px",
                    borderTopLeftRadius: "15px",
                    borderTopRightRadius: "15px",
                    paddingRight: "10px",
                    paddingLeft: "10px",
                    // whiteSpace: "nowrap", TODO: disabled for now as not working well in IE11
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end"
                  }}
                >
                  <i>{updatedAt}</i>{" "}
                  <LinkTo
                    modelType="Person"
                    model={note.author}
                    style={{ color: "white" }}
                  />
                  {canEdit && (
                    <>
                      <Button
                        title="Edit note"
                        onClick={() => showRelatedObjectNoteModal(note.uuid)}
                        bsSize="xsmall"
                        bsStyle="primary"
                      >
                        <Icon icon={IconNames.EDIT} />
                      </Button>
                      <RelatedObjectNoteModal
                        note={note}
                        questions={questions}
                        showModal={showRelatedObjectNoteModalKey === note.uuid}
                        onCancel={cancelRelatedObjectNoteModal}
                        onSuccess={hideEditRelatedObjectNoteModal}
                      />
                      <ConfirmDelete
                        onConfirmDelete={() => deleteNote(note.uuid)}
                        objectType="note"
                        objectDisplay={"#" + note.uuid}
                        title="Delete note"
                        bsSize="xsmall"
                        bsStyle="primary"
                      >
                        <img src={REMOVE_ICON} height={14} alt="Delete" />
                      </ConfirmDelete>
                    </>
                  )}
                </Panel.Heading>
                <Panel.Body>
                  <div
                    style={{
                      overflowWrap: "break-word",
                      /* IE: */ wordWrap: "break-word"
                    }}
                  >
                    {note.type === NOTE_TYPE.CHANGE_RECORD &&
                      (jsonFields.oldValue === jsonFields.newValue ? (
                        <span>
                          Field <b>{jsonFields.changedField}</b> was unchanged (
                          <em>'{jsonFields.oldValue}'</em>):
                        </span>
                      ) : (
                        <span>
                          Field <b>{jsonFields.changedField}</b> was changed
                          from <em>'{jsonFields.oldValue}'</em> to{" "}
                          <em>'{jsonFields.newValue}'</em>:
                        </span>
                      ))}
                    {note.type === NOTE_TYPE.PARTNER_ASSESSMENT && (
                      <>
                        <h4>
                          <u>
                            <b>Partner assessment</b>
                          </u>
                        </h4>
                        {Object.keys(jsonFields)
                          .filter(field => field !== "text")
                          .map(field => (
                            <p key={field}>
                              <i>{field}</i>: <b>{jsonFields[field]}</b>
                            </p>
                          ))}
                      </>
                    )}
                    {note.type === NOTE_TYPE.ASSESSMENT && (
                      <>
                        <h4>
                          <u>
                            <b>Assessment</b>
                          </u>
                        </h4>
                        {Object.keys(jsonFields)
                          .filter(field => field !== "text")
                          .map(field => (
                            <p key={field}>
                              <i>{field}</i>: <b>{jsonFields[field]}</b>
                            </p>
                          ))}
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      overflowWrap: "break-word",
                      /* IE: */ wordWrap: "break-word"
                    }}
                  >
                    {noteText}
                  </div>
                </Panel.Body>
              </Panel>
            )
          })}
        </div>
      </div>
    )
  }

  return notesElem && ReactDOM.createPortal(renderPortal(), notesElem)

  function toggleHidden() {
    setHidden(!hidden)
  }

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
    newNotes.unshift(note) // add updated note at the front
    setError(null)
    setShowRelatedObjectNoteModalKey(null)
    setNoteType(null)
    setNotes(newNotes)
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
BaseRelatedObjectNotes.propTypes = {
  currentUser: PropTypes.instanceOf(Person),
  notesElemId: PropTypes.string.isRequired,
  notes: PropTypes.arrayOf(Model.notePropTypes),
  relatedObject: PropTypes.shape({
    relatedObjectType: PropTypes.string.isRequired,
    relatedObjectUuid: PropTypes.string.isRequired
  }),
  relatedObjectValue: PropTypes.shape({
    role: PropTypes.string.isRequired,
    rank: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })
}
BaseRelatedObjectNotes.defaultProps = {
  notesElemId: "notes-view",
  notes: []
}

const RelatedObjectNotes = props => (
  <AppContext.Consumer>
    {context => (
      <BaseRelatedObjectNotes currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default RelatedObjectNotes
