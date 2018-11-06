import PropTypes from 'prop-types'
import React, { Component } from 'react'

import LinkTo from 'components/LinkTo'
import Model from 'components/Model'

import { Classes } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import _isEmpty from 'lodash/isEmpty'
import moment from 'moment'

import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

export const GRAPHQL_NOTES_FIELDS = Model.GRAPHQL_NOTES_FIELDS

export default class RelatedObjectNotes extends Component {
	static propTypes = {
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
		this.toggleHide = this.toggleHide.bind(this)
	}

	toggleHide() {
		this.setState({hide: !this.state.hide})
	}

	render() {
		if (_isEmpty(this.props.notes)) {
			return null
		}
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
					<button
						style={{float: 'right'}}
						className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.CROSS))}
						onClick={this.toggleHide}
						title="Hide notes"
					/>
					{this.props.notes.map(note =>
						<div key={note.uuid} style={{clear: 'both', paddingTop: '18px', backgroundColor: '#e8e8e8'}}>
							<span><b>{moment(note.createdAt).format("DD MMM YYYY HH:mm:ss")}</b>
							<br /><i>by <LinkTo person={note.author} /></i>:</span>
							<br /><div style={{backgroundColor: 'white'}} dangerouslySetInnerHTML={{__html: note.text}} />
						</div>
					)}
				</div>
			  </div>
	}
}
