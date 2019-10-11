import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import LinkTo from "components/LinkTo"
import Model, { NOTE_TYPE } from "components/Model"
import RelatedObjectNoteModal from "components/RelatedObjectNoteModal"
import { JSONPath } from "jsonpath-plus"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
import ReactDOM from "react-dom"
import NotificationBadge from "react-notification-badge"
import "./BlueprintOverrides.css"
import { Button, Panel } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import Pie from "components/graphs/Pie"

const GQL_DELETE_NOTE = gql`
  mutation($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

export { GRAPHQL_NOTES_FIELDS } from "components/Model"

class BaseRelatedObjectNotes extends Component {
  static propTypes = {
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

  static defaultProps = {
    notesElemId: "notes-view",
    notes: []
  }

  constructor(props) {
    super(props)
    this.state = {
      success: null,
      error: null,
      hide: true,
      showRelatedObjectNoteModalKey: null,
      noteType: null,
      notes: this.props.notes
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.notes, this.props.notes)) {
      this.setState({
        success: null,
        error: null,
        notes: this.props.notes
      })
    }
  }

  toggleHide = () => {
    this.setState({ hide: !this.state.hide })
  }

  showRelatedObjectNoteModal = (key, type) => {
    this.setState({
      success: null,
      error: null,
      showRelatedObjectNoteModalKey: key,
      noteType: type
    })
  }

  cancelRelatedObjectNoteModal = () => {
    this.setState({
      success: null,
      error: null,
      showRelatedObjectNoteModalKey: null,
      noteType: null
    })
  }

  hideNewRelatedObjectNoteModal = note => {
    this.state.notes.unshift(note) // add new note at the front
    this.setState({
      success: "note added",
      error: null,
      showRelatedObjectNoteModalKey: null,
      noteType: null,
      notes: this.state.notes
    })
  }

  hideEditRelatedObjectNoteModal = note => {
    const notes = this.state.notes.filter(item => item.uuid !== note.uuid) // remove old note
    notes.unshift(note) // add updated note at the front
    this.setState({
      success: "note updated",
      error: null,
      showRelatedObjectNoteModalKey: null,
      noteType: null,
      notes: notes
    })
  }

  deleteNote = uuid => {
    API.mutation(GQL_DELETE_NOTE, { uuid })
      .then(data => {
        this.setState({
          success: "note deleted",
          error: null,
          notes: this.state.notes.filter(item => item.uuid !== uuid) // remove note
        })
      })
      .catch(error => {
        this.setState({
          success: null,
          error: error
        })
      })
  }

  render() {
    const notesElem = document.getElementById(this.props.notesElemId)
    return notesElem && ReactDOM.createPortal(this.renderPortal(), notesElem)
  }

  renderPortal = () => {
    const { currentUser } = this.props
    const { notes } = this.state
    const noNotes = _isEmpty(notes)
    const nrNotes = noNotes ? 0 : notes.length
    const badgeLabel = nrNotes > 10 ? "10+" : null
    const questions =
      this.props.relatedObject &&
      Settings.fields.principal.person.assessment &&
      this.props.relatedObject.relatedObjectType === "people" &&
      this.props.relatedObjectValue.role === Person.ROLE.PRINCIPAL
        ? Settings.fields.principal.person.assessment.questions.filter(
          question =>
            !question.test ||
              !_isEmpty(JSONPath(question.test, this.props.relatedObjectValue))
        )
        : []
    const assessments = notes.filter(
      note => note.type === NOTE_TYPE.PARTNER_ASSESSMENT
    )
    const assessmentsSummary = assessments.reduce((counters, assessment) => {
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
    }, {})

    return this.state.hide ? (
      <div style={{ minWidth: 50, padding: 5, marginRight: 15 }}>
        <NotificationBadge
          count={nrNotes}
          label={badgeLabel}
          style={{ fontSize: "8px", padding: 4 }}
          effect={["none", "none"]}
        />
        <Button bsSize="small" onClick={this.toggleHide} title="Show notes">
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
          <Button bsSize="small" onClick={this.toggleHide} title="Hide notes">
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
              this.showRelatedObjectNoteModal("new", NOTE_TYPE.FREE_TEXT)}
          >
            Post new note
          </Button>
          {questions.length > 0 && (
            <Button
              bsStyle="primary"
              style={{ margin: "5px" }}
              onClick={() =>
                this.showRelatedObjectNoteModal(
                  "new",
                  NOTE_TYPE.PARTNER_ASSESSMENT
                )}
            >
              Assess Person
            </Button>
          )}
        </div>
        <br />
        <RelatedObjectNoteModal
          note={{
            type: this.state.noteType,
            noteRelatedObjects: [{ ...this.props.relatedObject }]
          }}
          questions={questions}
          showModal={this.state.showRelatedObjectNoteModalKey === "new"}
          onCancel={this.cancelRelatedObjectNoteModal}
          onSuccess={this.hideNewRelatedObjectNoteModal}
        />
        {noNotes && (
          <div>
            <i>No notes</i>
          </div>
        )}

        {assessments.length > 0 && questions.length > 0 && (
          <Panel bsStyle="primary" style={{ width: "100%" }}>
            <Panel.Heading>
              Summary of <b>{assessments.length}</b> assessments for{" "}
              {this.props.relatedObjectValue.rank}{" "}
              {this.props.relatedObjectValue.name}
            </Panel.Heading>
            <Panel.Body>
              {questions.map(question => {
                return (
                  <React.Fragment key={question.id}>
                    {question.label}
                    <br />
                    <Pie
                      size={{ width: 70, height: 70 }}
                      data={assessmentsSummary[question.id]}
                      label={Object.values(
                        assessmentsSummary[question.id]
                      ).reduce((acc, cur) => acc + cur, 0)}
                      segmentFill={entity => {
                        const matching = question.choice.filter(
                          choice => choice.value === entity.data.key
                        )
                        return matching.length > 0
                          ? matching[0].color
                          : "#bbbbbb"
                      }}
                      segmentLabel={d => d.data.value}
                    />

                    <br />
                    {question.choice.map(choice => (
                      <React.Fragment key={choice.value}>
                        <span style={{ backgroundColor: choice.color }}>
                          {choice.label} :
                          <b>{assessmentsSummary[question.id][choice.value]}</b>{" "}
                        </span>
                      </React.Fragment>
                    ))}
                    <br />
                    <br />
                  </React.Fragment>
                )
              })}
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
            const canEdit = byMe || currentUser.isAdmin()
            const isJson = note.type !== NOTE_TYPE.FREE_TEXT
            const jsonFields = isJson && note.text ? JSON.parse(note.text) : {}
            const noteText = isJson ? jsonFields.text : note.text
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
                  <LinkTo style={{ color: "white" }} person={note.author} />
                  {canEdit && (
                    <>
                      <Button
                        title="Edit note"
                        onClick={() =>
                          this.showRelatedObjectNoteModal(note.uuid)}
                        bsSize="xsmall"
                        bsStyle="primary"
                      >
                        <Icon icon={IconNames.EDIT} />
                      </Button>
                      <RelatedObjectNoteModal
                        note={note}
                        questions={questions}
                        showModal={
                          this.state.showRelatedObjectNoteModalKey === note.uuid
                        }
                        onCancel={this.cancelRelatedObjectNoteModal}
                        onSuccess={this.hideEditRelatedObjectNoteModal}
                      />
                      <ConfirmDelete
                        onConfirmDelete={() => this.deleteNote(note.uuid)}
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
                  </div>
                  <div
                    style={{
                      overflowWrap: "break-word",
                      /* IE: */ wordWrap: "break-word"
                    }}
                    dangerouslySetInnerHTML={{ __html: noteText }}
                  />
                </Panel.Body>
              </Panel>
            )
          })}
        </div>
      </div>
    )
  }
}

const RelatedObjectNotes = props => (
  <AppContext.Consumer>
    {context => (
      <BaseRelatedObjectNotes currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default RelatedObjectNotes
