import PropTypes from 'prop-types'
import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'

import Fieldset from 'components/Fieldset'

import Settings from 'Settings'
import GQL from 'graphqlapi'
import API from 'api'
import {Person, Position} from 'models'

import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

import TOUR_SCREENSHOT from 'resources/tour-screenshot.png'

const screenshotCss = {
	width: "100%",
	boxShadow: "0px 0px 10px #aaa",
}

class BaseHelp extends Page {

	static propTypes = {
		...pagePropTypes,
		currentUser: PropTypes.instanceOf(Person),
	}

	constructor(props) {
		super(props)
		this.state = {
			superUsers: []
		}
	}

	fetchData(props) {
		const { currentUser } = props
		if (!currentUser.id || !currentUser.position || !currentUser.position.organization) {
			// No super users to be found
			return
		}

		const positionQuery = {
			pageNum: 0,
			pageSize: 0,  // retrieve all these positions
			type: [Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR],
			status: Position.STATUS.ACTIVE,
			organizationId: currentUser.position.organization.id
		}
		const positionsPart = new GQL.Part(/* GraphQL */`
			positionList(query: $positionQuery) {
				list {
					person { rank, name, emailAddress }
				}
			}`)
			.addVariable("positionQuery", "PositionSearchQueryInput", positionQuery)
		GQL.run([positionsPart]).then(data => {
			const filledPositions = data.positionList.list.filter(position => position && position.person)
			this.setState({
				superUsers: filledPositions.map(position => position.person)
			})
		})
	}

	render() {
		const { appSettings } = this.props || {}
		let url = appSettings.HELP_LINK_URL
		let email = appSettings.CONTACT_EMAIL

		const { currentUser } = this.props
		return <div className="help-page">
			<Fieldset title="Need help with ANET?">
				<p className="help-text">There are a few ways to get help:</p>

				<h4>1. Use the guided tours</h4>
				<p>If you're stuck on a page and you don't know what to do, look for the <strong>"Take a tour"</strong> link near the top of the page.</p>
				<img src={TOUR_SCREENSHOT} alt={"Screenshot of \"Guided Tour\" link"} style={screenshotCss} />

				<h4>2. Email your super user</h4>
				<p>Your organization's super users are able to modify a lot of data in the system regarding how your organization, position, profile, and {Settings.fields.principal.person.name} are set up.</p>
				<p>Your super users:</p>
				<ul>
					{this.state.superUsers.map(user =>
						<li key={user.emailAddress}>
							<a href={`mailto:${user.emailAddress}`}>{user.rank} {user.name} - {user.emailAddress}</a>
						</li>
					)}
					{this.state.superUsers.length === 0 && <em>No super users found</em>}
				</ul>

				<h4>3. Check out the FAQ</h4>
				<p>Many common issues are explained in the FAQ document, especially for common super user tasks.</p>
				<p><a href={url} target="help"><strong>The FAQ is available on the portal.</strong></a></p>

				<h4>4. Contact ANET support</h4>
				<p>Technical issues may be able to be resolved by the ANET administrators: <a href={`mailto:${email}`}>{email}</a></p>

				{currentUser.isAdmin() &&
				<div>
					<h4>Advanced troubleshooting</h4>
					<p>Admins, you can also consult the <a href="/assets/client/changelog.html">changelog</a>.</p>
				</div>
				}
			</Fieldset>
		</div>
	}
}

const Help = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseHelp appSettings={context.appSettings} currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(Help)
