import React, {PropTypes} from 'react'
import Page from 'components/Page'

import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages, {setMessages} from 'components/Messages'
import LinkTo from 'components/LinkTo'

import API from 'api'
import {AuthorizationGroup} from 'models'

export default class AuthorizationGroupShow extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			authorizationGroup: new AuthorizationGroup()
		}
		setMessages(props,this.state)
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			authorizationGroup(id:${props.params.id}) {
				id, name, description, positions { id, name, type }, status 
			}
		`).then(data => {
			this.setState({
				authorizationGroup: new AuthorizationGroup(data.authorizationGroup)
			})
		})
	}

	render() {
		let {authorizationGroup} = this.state
		let currentUser = this.context.currentUser

		return (
			<div>
				<Breadcrumbs items={[[authorizationGroup.name, AuthorizationGroup.pathFor(authorizationGroup)]]} />
				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={authorizationGroup} horizontal >
					<Fieldset title={authorizationGroup.name} action={currentUser.isSuperUser() && <LinkTo authorizationGroup={authorizationGroup} edit button="primary">Edit</LinkTo>}>
						<Form.Field id="description" />
						<Form.Field id="positions">
							{authorizationGroup.positions.map(position => <div key={position.id}><LinkTo position={position} /></div>)}
						</Form.Field>
						<Form.Field id="status">{authorizationGroup.humanNameOfStatus()}</Form.Field>
					</Fieldset>
				</Form>
			</div>
		)
	}
}
