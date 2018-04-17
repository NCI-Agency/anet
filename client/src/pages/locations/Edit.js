import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Messages from 'components/Messages'

import LocationForm from './Form'
import {Location} from 'models'

import API from 'api'

import { setPageProps, PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class LocationEdit extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)

		this.state = {
			location: {},
			originalLocation : {}
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			location(uuid:"${props.match.params.uuid}") {
				uuid, name, status, lat, lng
			}
		`).then(data => {
			this.setState({location: new Location(data.location), originalLocation : new Location(data.location) })
		})
	}

	render() {
		let location = this.state.location

		return (
			<div>
				<Messages error={this.state.error} success={this.state.success} />

				<LocationForm original={this.state.originalLocation} anetLocation={location} edit />
			</div>
		)
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(LocationEdit)
