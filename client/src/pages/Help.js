import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'

import Fieldset from 'components/Fieldset'

import API from 'api'
import {Position} from 'models'

import { setPageProps } from 'actions'
import { connect } from 'react-redux'

import TOUR_SCREENSHOT from 'resources/tour-screenshot.png'

const screenshotCss = {
	width: "100%",
	boxShadow: "0px 0px 10px #aaa",
}

class Help extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			superUsers: []
		}
	}

	fetchData() {
		let {currentUser} = this.context.app.state
		if (!currentUser.id || !currentUser.position || !currentUser.position.organization) {
			// No super users to be found
			return
		}

		let orgId = currentUser.position.organization.id
		API.query(/* GraphQL */`
			positionList(f:search,query:{type:[${Position.TYPE.SUPER_USER},${Position.TYPE.ADMINISTRATOR}],status:${Position.STATUS.ACTIVE},organizationId:${orgId}}) {
				list {
					person { rank, name, emailAddress }
				}
			}
		`).then(data => {
			const filledPositions = data.positionList.list.filter(position => position && position.person)
			this.setState({
				superUsers: filledPositions.map(position => position.person)
			})
		})
	}

	render() {
		let {settings} = this.context.app.state || {}
		let url = settings.HELP_LINK_URL
		let email = settings.CONTACT_EMAIL

		let appData = this.context.app.state
		let currentUser = appData.currentUser
		return <div className="help-page">
			<Fieldset title="Need help with ANET?">
				<p className="help-text">There are a few ways to get help:</p>

				<h4>1. Use the guided tours</h4>
				<p>If you're stuck on a page and you don't know what to do, look for the <strong>"Take a tour"</strong> link near the top of the page.</p>
				<img src={TOUR_SCREENSHOT} alt={"Screenshot of \"Guided Tour\" link"} style={screenshotCss} />

				<h4>2. Email your super user</h4>
				<p>Your organization's super users are able to modify a lot of data in the system regarding how your organization, position, principal, and profile are set up.</p>
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

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(Help)
