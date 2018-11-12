import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import AppContext from 'components/AppContext'
import ConfirmDelete from 'components/ConfirmDelete'
import LinkTo from 'components/LinkTo'
import Messages from 'components/Messages'
import Model from 'components/Model'
import RelatedObjectNoteModal from 'components/RelatedObjectNoteModal'

import {Person} from 'models'
import API from 'api'

import { Classes } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import moment from 'moment'

import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

export const GRAPHQL_NOTES_FIELDS = Model.GRAPHQL_NOTES_FIELDS

class BaseRelatedObjectNotes extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		notesElemId: PropTypes.string.isRequired,
		notes: PropTypes.arrayOf(Model.notePropTypes),
		relatedObject: PropTypes.shape({
			relatedObjectType: PropTypes.string.isRequired,
			relatedObjectUuid: PropTypes.string.isRequired,
		}),
	}

	static defaultProps = {
		notesElemId: 'notes-view',
		notes: [],
	}

	constructor(props) {
		super(props)
		this.state = {
			success: null,
			error: null,
			hide: true,
			showRelatedObjectNoteModal: null,
			notes: this.props.notes,
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_isEqual(prevProps.notes, this.props.notes)) {
			this.setState({
				notes: this.props.notes,
			})
		}
	}

	toggleHide = () => {
		this.setState({hide: !this.state.hide})
	}

	showRelatedObjectNoteModal = (key) => {
		this.setState({
			success: null,
			error: null,
			showRelatedObjectNoteModal: key,
		})
	}

	cancelRelatedObjectNoteModal = () => {
		this.setState({
			success: null,
			error: null,
			showRelatedObjectNoteModal: null
		})
	}

	hideNewRelatedObjectNoteModal = (note) => {
		this.state.notes.unshift(note) // add new note
		this.setState({
			success: 'note added',
			error: null,
			showRelatedObjectNoteModal: null,
			notes: this.state.notes,
		})
	}

	hideEditRelatedObjectNoteModal = (note) => {
		this.setState({
			success: 'note updated',
			error: null,
			showRelatedObjectNoteModal: null,
			notes: this.state.notes, // note is updated in-place
		})
	}

	deleteNote = (uuid) => {
		const operation = 'deleteNote'
		let graphql = operation + '(uuid: $uuid)'
		const variables = { uuid: uuid }
		const variableDef = '($uuid: String!)'
		API.mutation(graphql, variables, variableDef)
			.then(data => {
				this.setState({
					success: 'note deleted',
					error: null,
					notes: this.state.notes.filter(item => item.uuid !== uuid), // remove note
				})
			}).catch(error => {
				this.setState({
					success: null,
					error: error,
				})
			})
	}

	render() {
		const notesElem = document.getElementById(this.props.notesElemId)
		return notesElem &&
			ReactDOM.createPortal(
				this.renderPortal(),
				notesElem
			)
	}

	renderPortal = () => {
		const DATE_FORMAT = 'DD MMM YYYY HH:mm:ss'
		const { currentUser } = this.props
		const { notes } = this.state
		return this.state.hide
			? <div>
				<button
					className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.COMMENT))}
					onClick={this.toggleHide}
					title="Show notes"
				/>
			  </div>
			: <div>
				<h4 style={{float: 'left', verticalAlign: 'text-bottom'}}>Notes</h4>
				<span style={{float: 'right'}}>
					<button
						className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ADD))}
						title="Post a new note"
						onClick={() => this.showRelatedObjectNoteModal('new')}
					/>
					<RelatedObjectNoteModal
						note={{noteRelatedObjects: [{...this.props.relatedObject}]}}
						showModal={this.state.showRelatedObjectNoteModal === 'new'}
						onCancel={this.cancelRelatedObjectNoteModal}
						onSuccess={this.hideNewRelatedObjectNoteModal}
					/>
					<button
						className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.CROSS))}
						onClick={this.toggleHide}
						title="Hide notes"
					/>
				</span>
				<div style={{clear: 'both'}}>
					<Messages error={this.state.error} success={this.state.success} />
				</div>
				{_isEmpty(notes) &&
					<div style={{clear: 'both', paddingTop: '18px', backgroundColor: '#e8e8e8'}}>
						<i>No notes</i>
					</div>
				}
				{notes.map(note => {
					const updatedAt = moment(note.updatedAt).format(DATE_FORMAT)
					const byMe = Person.isEqual(currentUser, note.author)
					const author = byMe ? 'me' : <LinkTo person={note.author} />
					const canEdit = byMe || currentUser.isAdmin()
					return (
						<div key={note.uuid} style={{clear: 'both', paddingTop: '18px', backgroundColor: '#e8e8e8'}}>
							<span style={{float: 'left'}}>
								<b>{updatedAt}</b>
								<br /><i>by {author}</i>:
							</span>
							{canEdit && (
								<span style={{float: 'right'}}>
									<button
										className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.EDIT))}
										title="Edit note"
										onClick={() => this.showRelatedObjectNoteModal(note.uuid)}
									/>
									<RelatedObjectNoteModal
										note={note}
										showModal={this.state.showRelatedObjectNoteModal === note.uuid}
										onCancel={this.cancelRelatedObjectNoteModal}
										onSuccess={this.hideEditRelatedObjectNoteModal}
									/>
									<ConfirmDelete
										onConfirmDelete={() => this.deleteNote(note.uuid)}
										objectType="note"
										objectDisplay={'#' + note.uuid}
										bsStyle="warning"
										title="Delete note"
										className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.DELETE))} />
								</span>
							)}
							<div style={{clear: 'both', backgroundColor: 'white'}} dangerouslySetInnerHTML={{__html: note.text}} />
						</div>
					)
				})}
			  </div>
	}
}

const RelatedObjectNotes = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseRelatedObjectNotes currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default RelatedObjectNotes
