import PropTypes from 'prop-types'
import React from 'react'

import Breadcrumbs from 'components/Breadcrumbs'
import Page, {mapDispatchToProps} from 'components/Page'
import Fieldset from 'components/Fieldset'
import AuthorizationGroupTable from 'components/AuthorizationGroupTable'

import API from 'api'

import { connect } from 'react-redux'

class AuthorizationGroups extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props)

		this.state = {
			authorizationGroups: []
		}
	}

	fetchData() {
		API.query(/* GraphQL */`
			authorizationGroupList(f:getAll) {
				list { uuid, name, description, positions { uuid, name, type }, status }
			}
		`).then(data => {
			this.setState({authorizationGroups: data.authorizationGroupList.list})
		})
	}

	render() {
		return (
			<div>
				<Breadcrumbs items={[['Authorization Groups', '/admin/authorizationGroups']]} />
				<Fieldset title='Authorization groups' id='12'>
					<AuthorizationGroupTable authorizationGroups={this.state.authorizationGroups} />
				</Fieldset>
			</div>
		)
	}

}

export default connect(null, mapDispatchToProps)(AuthorizationGroups)
