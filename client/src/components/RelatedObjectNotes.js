import PropTypes from 'prop-types'
import React, { Component } from 'react'

import AppContext from 'components/AppContext'
import LinkTo from 'components/LinkTo'
import Model from 'components/Model'
import {Person} from 'models'

import { Classes } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import _isEmpty from 'lodash/isEmpty'
import moment from 'moment'

import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

export const GRAPHQL_NOTES_FIELDS = Model.GRAPHQL_NOTES_FIELDS

class BaseRelatedObjectNotes extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		notes: PropTypes.arrayOf(PropTypes.shape({
			uuid: PropTypes.string.isRequired,
			createdAt: PropTypes.number.isRequired,
			text: PropTypes.string.isRequired,
			author: PropTypes.object.isRequired,
		})),
	}

	constructor(props) {
		super(props)
		this.state = {hide: true}
	}

	toggleHide = () => {
		this.setState({hide: !this.state.hide})
	}

	render() {
		const DATE_FORMAT = 'DD MMM YYYY HH:mm:ss'
		const { currentUser, notes } = this.props
		return this.state.hide
			? <div style={{paddingLeft: '1.5rem', width: '1.5rem'}}>
				<div style={{position: 'fixed', right: '1.5rem'}}>
					<button
						className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.COMMENT))}
						onClick={this.toggleHide}
						title="Show notes"
					/>
				</div>
			  </div>
			: <div style={{paddingLeft: '1.5rem', flexGrow: 1, minWidth: '20%'}}>
				<div style={{position: 'fixed', paddingRight: '1.5rem', width: 'inherit'}}>
					<h4 style={{float: 'left', verticalAlign: 'text-bottom'}}>Notes</h4>
					<span style={{float: 'right'}}>
						<button
							className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ADD))}
							title="Post a note"
						/>
						<button
							className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.CROSS))}
							onClick={this.toggleHide}
							title="Hide notes"
						/>
					</span>
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
										/>
										<button
											className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.DELETE))}
											title="Delete note"
										/>
									</span>
								)}
								<div style={{clear: 'both', backgroundColor: 'white'}} dangerouslySetInnerHTML={{__html: note.text}} />
							</div>
						)
					})}
				</div>
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
