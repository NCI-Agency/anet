import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Modal, Button} from 'react-bootstrap'
import * as yup from 'yup'

import { Formik, Form, Field } from 'formik'
import * as FieldHelper from 'components/FieldHelper'

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
	yupSchema = yup.object().shape({
		text: yup.string().required().default('')
	})
	state = {
		error: null,
	}

	render() {
		const { showModal, note, currentUser } = this.props
		return (
			<Modal show={showModal} onHide={this.close}>
				<Formik
					enableReinitialize={true}
					onSubmit={this.onSubmit}
					validationSchema={this.yupSchema}
					isInitialValid={() => this.yupSchema.isValidSync(note)}
					initialValues={note}
				>
				{({
					isSubmitting,
					isValid,
					setFieldValue,
					values,
					submitForm
				}) => {
					return <Form>
								<Modal.Header closeButton>
									<Modal.Title>{note.uuid ? 'Edit note' : 'Post a new note'}</Modal.Title>
								</Modal.Header>
								<Modal.Body>
									<Messages error={this.state.error} />
									<Field
										name="text"
										component={FieldHelper.renderSpecialField}
										onChange={(value) => setFieldValue('text', value)}
										widget={<RichTextEditor className="textField" />}
										vertical={true}
									/>
								</Modal.Body>
								<Modal.Footer>
									<Button className="pull-left" onClick={this.close}>Cancel</Button>
									<Button onClick={submitForm} bsStyle="primary" disabled={isSubmitting || !isValid}>Save</Button>
								</Modal.Footer>
							</Form>
				}}
				</Formik>
			</Modal>
		)
	}

	onSubmit = (values, form) => {
		return this.save(values, form)
			.then(response => this.onSubmitSuccess(response, values, form))
			.catch(error => {
				this.setState({error})
			})
	}

	onSubmitSuccess = (response, values, form) => {
		const edit = !!this.props.note.uuid
		const operation = edit ? 'updateNote' : 'createNote'
		this.props.onSuccess(response[operation])
	}

	save = (values, form) => {
		const edit = !!this.props.note.uuid
		const operation = edit ? 'updateNote' : 'createNote'
		const graphql = operation + `(note: $note) { ${GRAPHQL_NOTE_FIELDS} }`
		const variables = {note: values}
		const variableDef = '($note: NoteInput!)'
		return API.mutation(graphql, variables, variableDef)
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
