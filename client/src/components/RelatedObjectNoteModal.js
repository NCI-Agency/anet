import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Modal, Button} from 'react-bootstrap'

import AppContext from 'components/AppContext'
import Messages from'components/Messages'
import Model, { GRAPHQL_NOTE_FIELDS } from 'components/Model'
import RichTextEditor from 'components/RichTextEditor'

import {Person} from 'models'
import API from 'api'

class BaseRelatedObjectNoteModal extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		note: Model.notePropTypes,
		showModal: PropTypes.bool,
		onCancel: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			error: null,
		}
	}

	render() {
		const { showModal, note, currentUser } = this.props

		return (
			<Modal show={showModal} onHide={this.close}>
				<Modal.Header closeButton>
					<Modal.Title>{note.uuid ? 'Edit note' : 'Post a new note'}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Messages error={this.state.error} />
					<RichTextEditor value={note.text} onChange={this.onChangeNoteText} />
				</Modal.Body>
				<Modal.Footer>
					<Button className="pull-left" onClick={this.close}>Cancel</Button>
					<Button onClick={this.save} bsStyle={"primary"} >Save</Button>
				</Modal.Footer>
			</Modal>
		)
	}

	onChangeNoteText = (value) => {
		this.props.note.text = value
	}

	save = () => {
		const { note } = this.props
		const edit = !!note.uuid
		const operation = edit ? 'updateNote' : 'createNote'
		const graphql = operation + `(note: $note) { ${GRAPHQL_NOTE_FIELDS} }`
		const variables = {note: note}
		const variableDef = '($note: NoteInput!)'
		API.mutation(graphql, variables, variableDef, {disableSubmits: true})
			.then(data => {
				this.props.onSuccess(data[operation])
			}).catch(error => {
				this.setState({
					error: error
				})
			})
	}

	close = () => {
		// Reset state before closing (cancel)
		this.setState({
			error: null,
		})
		this.props.onCancel()
	}
}

const RelatedObjectNoteModal = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseRelatedObjectNoteModal currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default RelatedObjectNoteModal
