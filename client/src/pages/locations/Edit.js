import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Messages from 'components/Messages'
import RelatedObjectNotes, {GRAPHQL_NOTES_FIELDS} from 'components/RelatedObjectNotes'

import LocationForm from './Form'
import {Location} from 'models'

import API from 'api'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class LocationEdit extends Page {

	static propTypes = {
		...pagePropTypes,
	}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			location: new Location(),
			originalLocation : new Location()
		}
	}

	fetchData(props) {
		return API.query(/* GraphQL */`
			location(uuid:"${props.match.params.uuid}") {
				uuid, name, status, lat, lng
				${GRAPHQL_NOTES_FIELDS}
			}
		`).then(data => {
			this.setState({location: new Location(data.location), originalLocation : new Location(data.location) })
		})
	}

	render() {
		let location = this.state.location

		return (
			<div>
				<RelatedObjectNotes notes={location.notes} relatedObject={{relatedObjectType: 'locations', relatedObjectUuid: location.uuid}} />
				<Messages error={this.state.error} success={this.state.success} />

				<LocationForm original={this.state.originalLocation} anetLocation={location} edit />
			</div>
		)
	}
}

export default connect(null, mapDispatchToProps)(LocationEdit)
