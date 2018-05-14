import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Nav as BSNav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import {IndexLinkContainer as Link} from 'react-router-bootstrap'
import Scrollspy from 'react-scrollspy'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import pluralize from 'pluralize'

import {Organization} from 'models'

import { withRouter } from 'react-router-dom'

class Nav extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	constructor(props) {
		super(props)
		this.state = {
			scrollspyOffset: 0
		}
	}

	componentWillReceiveProps(nextProps) {
		const scrollspyOffset = -(nextProps.topbarOffset + 20)
		if (this.state.scrollspyOffset !== scrollspyOffset) {
			this.setState({scrollspyOffset: scrollspyOffset})
		}
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
		let orgId, myOrgId
		if (inOrg) {
			orgId = +path.split('/')[2]
			myOrgId = myOrg && +myOrg.id
		}

		const orgSubNav = (
			<li>
				<Scrollspy className="nav" currentClassName="active" offset={this.state.scrollspyOffset}
					items={ ['info', 'supportedPositions', 'vacantPositions', 'approvals', 'tasks', 'reports'] }>
					<NavItem href="#info">Info</NavItem>
					<NavItem href="#supportedPositions">Supported positions</NavItem>
					<NavItem href="#vacantPositions">Vacant positions</NavItem>
					<NavItem href="#approvals">Approvals</NavItem>
					<NavItem href="#tasks">{pluralize(Settings.fields.task.shortLabel)}</NavItem>
					<NavItem href="#reports">Reports</NavItem>
				</Scrollspy>
			</li>
		)

		return (
			<BSNav bsStyle="pills" stacked id="leftNav" className="nav-fixed hide-for-print">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				<li id="search-nav"></li>

				{currentUser.id && <Link to={{pathname: '/reports/mine'}}>
					<NavItem>My reports</NavItem>
				</Link>}

				{inMyReports &&
					<li>
						<Scrollspy className="nav" currentClassName="active" offset={this.state.scrollspyOffset}
							items={ ['draft-reports', 'upcoming-engagements', 'pending-approval', 'published-reports'] }>
							<NavItem href="#draft-reports">Draft reports</NavItem>
							<NavItem href="#upcoming-engagements">Upcoming Engagements</NavItem>
							<NavItem href="#pending-approval">Pending approval</NavItem>
							<NavItem href="#published-reports">Published reports</NavItem>
						</Scrollspy>
					</li>
				}

				{myOrg && <Link to={Organization.pathFor(myOrg)}>
					<NavItem id="my-organization">My organization <br /><small>{myOrg.shortName}</small></NavItem>
				</Link>}

				{inOrg && orgId === myOrgId && orgSubNav}

				<NavDropdown title={Settings.fields.advisor.org.allOrgName} id="organizations" active={inOrg && orgId !== myOrgId}>
					{Organization.map(organizations, org =>
						<LinkTo organization={org} componentClass={Link} key={org.id}>
							<MenuItem>{org.shortName}</MenuItem>
						</LinkTo>
					)}
				</NavDropdown>

				{inOrg && orgId !== myOrgId && orgSubNav}

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
					<li>
						<ul className="nav">
							<Link to={"/admin/mergePeople"}><NavItem>Merge people</NavItem></Link>
							<Link to={"/admin/authorizationGroups"}><NavItem>Authorization groups</NavItem></Link>
						</ul>
					</li>
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
