import { Classes, Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { gql } from "apollo-boost"
import classNames from "classnames"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { NOTE_TYPE } from "components/Model"
import RelatedObjectNoteModal from "components/RelatedObjectNoteModal"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
import ReactDOM from "react-dom"
import NotificationBadge from "react-notification-badge"
import "./BlueprintOverrides.css"

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
      showRelatedObjectNoteModal: null,
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

  showRelatedObjectNoteModal = key => {
    this.setState({
      success: null,
      error: null,
      showRelatedObjectNoteModal: key
    })
  }

  cancelRelatedObjectNoteModal = () => {
    this.setState({
      success: null,
      error: null,
      showRelatedObjectNoteModal: null
    })
  }

  hideNewRelatedObjectNoteModal = note => {
    this.state.notes.unshift(note) // add new note at the front
    this.setState({
      success: "note added",
      error: null,
      showRelatedObjectNoteModal: null,
      notes: this.state.notes
    })
  }

  hideEditRelatedObjectNoteModal = note => {
    const notes = this.state.notes.filter(item => item.uuid !== note.uuid) // remove old note
    notes.unshift(note) // add updated note at the front
    this.setState({
      success: "note updated",
      error: null,
      showRelatedObjectNoteModal: null,
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
    const noteDivStyle = {
      clear: "both",
      paddingTop: "18px",
      backgroundColor: "#e8e8e8"
    }
    return this.state.hide ? (
      <div style={{ minWidth: 50, padding: 5, marginRight: 15 }}>
        <NotificationBadge
          count={nrNotes}
          label={badgeLabel}
          style={{ fontSize: "8px", padding: 4 }}
          effect={["none", "none"]}
        />
        <button
          className={classNames(Classes.BUTTON)}
          onClick={this.toggleHide}
          title="Show notes"
        >
          <Icon icon={IconNames.COMMENT} />
        </button>
      </div>
    ) : (
      <div style={{ padding: 5 }}>
        <h4 style={{ float: "left", verticalAlign: "text-bottom" }}>Notes</h4>
        <span style={{ float: "right" }}>
          <button
            className={classNames(Classes.BUTTON)}
            title="Post a new note"
            onClick={() => this.showRelatedObjectNoteModal("new")}
          >
            <Icon icon={IconNames.ADD} />
          </button>
          <RelatedObjectNoteModal
            note={{
              type: NOTE_TYPE.FREE_TEXT,
              noteRelatedObjects: [{ ...this.props.relatedObject }]
            }}
            showModal={this.state.showRelatedObjectNoteModal === "new"}
            onCancel={this.cancelRelatedObjectNoteModal}
            onSuccess={this.hideNewRelatedObjectNoteModal}
          />
          <button
            className={classNames(Classes.BUTTON)}
            onClick={this.toggleHide}
            title="Hide notes"
          >
            <Icon icon={IconNames.CROSS} />
          </button>
        </span>
        <div style={{ clear: "both" }}>
          <Messages error={this.state.error} success={this.state.success} />
        </div>
        {noNotes && (
          <div style={noteDivStyle}>
            <i>No notes</i>
          </div>
        )}
        {notes.map(note => {
          const updatedAt = moment(note.updatedAt).fromNow()
          const byMe = Person.isEqual(currentUser, note.author)
          const author = byMe ? "me" : <LinkTo person={note.author} />
          const canEdit = byMe || currentUser.isAdmin()
          const isJson = note.type !== NOTE_TYPE.FREE_TEXT
          const jsonFields = isJson ? JSON.parse(note.text) : {}
          const noteText = isJson ? jsonFields.text : note.text
          return (
            <div key={note.uuid} style={noteDivStyle}>
              <span style={{ float: "left" }}>
                <b>{updatedAt}</b>
                <br />
                <i>by {author}:</i>
              </span>
              {canEdit && (
                <span style={{ float: "right" }}>
                  <button
                    className={classNames(Classes.BUTTON)}
                    title="Edit note"
                    onClick={() => this.showRelatedObjectNoteModal(note.uuid)}
                  >
                    <Icon icon={IconNames.EDIT} />
                  </button>
                  <RelatedObjectNoteModal
                    note={note}
                    showModal={
                      this.state.showRelatedObjectNoteModal === note.uuid
                    }
                    onCancel={this.cancelRelatedObjectNoteModal}
                    onSuccess={this.hideEditRelatedObjectNoteModal}
                  />
                  <ConfirmDelete
                    onConfirmDelete={() => this.deleteNote(note.uuid)}
                    objectType="note"
                    objectDisplay={"#" + note.uuid}
                    bsStyle="warning"
                    title="Delete note"
                    className={classNames(Classes.BUTTON)}
                  >
                    <Icon icon={IconNames.DELETE} />
                  </ConfirmDelete>
                </span>
              )}
              {isJson ? (
                <div
                  style={{
                    clear: "both",
                    backgroundColor: "white",
                    overflowWrap: "break-word",
                    /* IE: */ wordWrap: "break-word"
                  }}
                >
                  {jsonFields.oldValue === jsonFields.newValue ? (
                    <span>
                      Field <b>{jsonFields.changedField}</b> was unchanged (
                      <em>'{jsonFields.oldValue}'</em>):
                    </span>
                  ) : (
                    <span>
                      Field <b>{jsonFields.changedField}</b> was changed from{" "}
                      <em>'{jsonFields.oldValue}'</em> to{" "}
                      <em>'{jsonFields.newValue}'</em>:
                    </span>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: noteText }} />
                </div>
              ) : (
                <div
                  style={{
                    clear: "both",
                    backgroundColor: "white",
                    overflowWrap: "break-word",
                    /* IE: */ wordWrap: "break-word"
                  }}
                  dangerouslySetInnerHTML={{ __html: noteText }}
                />
              )}
            </div>
          )
        })}
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
