import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Nav as BSNav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import {IndexLinkContainer as Link} from 'react-router-bootstrap'
import {Scrollspy} from 'react-scrollspy'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import pluralize from 'pluralize'

import {Organization} from 'models'

import { withRouter } from 'react-router-dom'

class Nav extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		const appData = this.context.app.state
		const currentUser = appData.currentUser
		const organizations = appData.organizations || []
		const path = this.props.location.pathname

		const {settings} = appData || {}
		const externalDocumentationUrl = settings.EXTERNAL_DOCUMENTATION_LINK_URL
		const externalDocumentationUrlText = settings.EXTERNAL_DOCUMENTATION_LINK_TEXT

		const inAdmin = path.indexOf('/admin') === 0
		const inOrg = path.indexOf('/organizations') === 0
		const inMyReports = path.indexOf('/reports/mine') === 0
		const inInsights = path.indexOf('/insights') === 0

		const myOrg = currentUser.position ? currentUser.position.organization : null
		let orgUuid, myOrgUuid
		if (inOrg) {
			orgUuid = +path.split('/')[2]
			myOrgUuid = myOrg && +myOrg.uuid
		}

		const orgSubNav = (
			<SubNav
				componentClass={Scrollspy}
				className="nav"
				offset={-152}
			>
				<AnchorLink scrollTo="info">Info</AnchorLink>
				<AnchorLink scrollTo="laydown">Laydown</AnchorLink>
				<AnchorLink scrollTo="approvals">Approvals</AnchorLink>
				<AnchorLink scrollTo="tasks">{pluralize(Settings.fields.task.shortLabel)}</AnchorLink>
				<AnchorLink scrollTo="reports">Reports</AnchorLink>
			</SubNav>
		)

		return (
			<BSNav bsStyle="pills" stacked id="leftNav">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				<li id="search-nav"></li>

				{currentUser.uuid && <Link to={{pathname: '/reports/mine'}}>
					<NavItem>My reports</NavItem>
				</Link>}

				{inMyReports &&
					<SubNav
						componentClass={Scrollspy}
						className="nav"
						offset={-152}
					>
						<AnchorLink scrollTo="draft-reports">Draft reports</AnchorLink>
						<AnchorLink scrollTo="upcoming-engagements">Upcoming Engagements</AnchorLink>
						<AnchorLink scrollTo="pending-approval">Pending approval</AnchorLink>
						<AnchorLink scrollTo="published-reports">Published reports</AnchorLink>
					</SubNav>
				}

				{myOrg && <Link to={Organization.pathFor(myOrg)}>
					<NavItem id="my-organization">My organization <br /><small>{myOrg.shortName}</small></NavItem>
				</Link>}

				{inOrg && orgUuid === myOrgUuid && orgSubNav}

				<NavDropdown title={Settings.fields.advisor.org.allOrgName} id="organizations" active={inOrg && orgUuid !== myOrgUuid}>
					{Organization.map(organizations, org =>
						<LinkTo organization={org} componentClass={Link} key={org.uuid}>
							<MenuItem>{org.shortName}</MenuItem>
						</LinkTo>
					)}
				</NavDropdown>

				{inOrg && orgUuid !== myOrgUuid && orgSubNav}

				<Link to="/rollup">
					<NavItem>Daily rollup</NavItem>
				</Link>

				{process.env.NODE_ENV === 'development' &&
					<Link to="/graphiql">
						<NavItem>GraphQL</NavItem>
					</Link>
				}

				{currentUser.isAdmin() &&
					<Link to="/admin">
						<NavItem>Admin</NavItem>
					</Link>
				}

				{inAdmin &&
					<SubNav>
						<Link to={"/admin/mergePeople"}><NavItem>Merge people</NavItem></Link>
						<Link to={"/admin/authorizationGroups"}><NavItem>Authorization groups</NavItem></Link>
					</SubNav>
				}
				
				{externalDocumentationUrl && externalDocumentationUrlText &&
					<li alt="">
						<a href={externalDocumentationUrl} target="_extdocs">{externalDocumentationUrlText}</a>
					</li>
				}

				<Link to="/help">
					<NavItem>Help</NavItem>
				</Link>

				{(currentUser.isAdmin() || currentUser.isSuperUser()) &&
					<NavDropdown title="Insights" id="insights" active={inInsights}>
						<Link to="/insights/not-approved-reports">
							<MenuItem>Pending approval reports</MenuItem>
						</Link>
						<Link to="/insights/cancelled-reports">
							<MenuItem>Cancelled engagement reports</MenuItem>
						</Link>
						<Link to="/insights/reports-by-task">
							<MenuItem>Reports by task</MenuItem>
						</Link>
						<Link to="/insights/future-engagements-by-location">
							<MenuItem>Future engagements by location</MenuItem>
						</Link>
						<Link to="/insights/reports-by-day-of-week">
							<MenuItem>Reports by day of the week</MenuItem>
						</Link>
						<Link to="/insights/advisor-reports">
							<MenuItem>Advisor reports</MenuItem>
						</Link>
					</NavDropdown>
				}
			</BSNav>
		)
	}
}

export default withRouter(Nav)

function SubNav(props) {
	let {componentClass, ...childProps} = props
	childProps = Object.without(childProps, 'active')

	let Component = componentClass || BSNav
	return <li>
		<Component {...childProps} />
	</li>
}

const AnchorLink = function(props) {
	const {scrollTo, ...childProps} = props
	const onClick = function() {
		const elem = document.getElementById(scrollTo)
		elem && elem.scrollIntoView(true)
	}
	return <NavItem onClick={onClick} {...childProps} />
}
