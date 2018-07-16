import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Nav as BSNav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import {IndexLinkContainer as Link} from 'react-router-bootstrap'
import Scrollspy from 'react-scrollspy'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import pluralize from 'pluralize'
import NavWrap from 'components/NavWrap'

import {Organization, Person} from 'models'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'

class BaseNav extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		appSettings: PropTypes.object,
		organizations: PropTypes.array,
	}

	constructor(props) {
		super(props)
		this.state = {
			scrollspyOffset: 0
		}
	}

	static getDerivedStateFromProps(props, state) {
		const scrollspyOffset = -(props.topbarOffset + 20)
		if (state.scrollspyOffset !== scrollspyOffset) {
			return {scrollspyOffset: scrollspyOffset}
		}
		return null
	}

	render() {
		const { currentUser } = this.props
		const { organizations } = this.props || []
		const { appSettings } = this.props || {}
		const externalDocumentationUrl = appSettings.EXTERNAL_DOCUMENTATION_LINK_URL
		const externalDocumentationUrlText = appSettings.EXTERNAL_DOCUMENTATION_LINK_TEXT

		const path = this.props.location.pathname
		const inAdmin = path.indexOf('/admin') === 0
		const inOrg = path.indexOf('/organizations') === 0
		const inMyReports = path.indexOf('/reports/mine') === 0
		const inInsights = path.indexOf('/insights') === 0

		const myOrg = currentUser.position ? currentUser.position.organization : null
		let orgUuid, myOrgUuid
		if (inOrg) {
			orgUuid = path.split('/')[2]
			myOrgUuid = myOrg && myOrg.uuid
		}

		const orgSubNav = (
			<NavWrap>
				<Scrollspy className="nav" currentClassName="active" offset={this.state.scrollspyOffset}
					items={ ['info', 'supportedPositions', 'vacantPositions', 'approvals', 'tasks', 'reports'] }>
					<NavItem href="#info">Info</NavItem>
					<NavItem href="#supportedPositions">Supported positions</NavItem>
					<NavItem href="#vacantPositions">Vacant positions</NavItem>
					<NavItem href="#approvals">Approvals</NavItem>
					<NavItem href="#tasks">{pluralize(Settings.fields.task.shortLabel)}</NavItem>
					<NavItem href="#reports">Reports</NavItem>
				</Scrollspy>
			</NavWrap>
		)

		return (
			<BSNav bsStyle="pills" stacked id="leftNav" className="nav-fixed">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				<NavWrap id="search-nav"></NavWrap>

				{currentUser.uuid && <Link to={{pathname: '/reports/mine'}}>
					<NavItem>My reports</NavItem>
				</Link>}

				{inMyReports &&
					<NavWrap>
						<Scrollspy className="nav" currentClassName="active" offset={this.state.scrollspyOffset}
							items={ ['draft-reports', 'upcoming-engagements', 'pending-approval', 'published-reports'] }>
							<NavItem href="#draft-reports">Draft reports</NavItem>
							<NavItem href="#upcoming-engagements">Upcoming Engagements</NavItem>
							<NavItem href="#pending-approval">Pending approval</NavItem>
							<NavItem href="#published-reports">Published reports</NavItem>
						</Scrollspy>
					</NavWrap>
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
					<NavWrap>
						<ul className="nav">
							<Link to={"/admin/mergePeople"}><NavItem>Merge people</NavItem></Link>
							<Link to={"/admin/authorizationGroups"}><NavItem>Authorization groups</NavItem></Link>
						</ul>
					</NavWrap>
				}
				
				{externalDocumentationUrl && externalDocumentationUrlText &&
					<NavItem href={externalDocumentationUrl} target="_extdocs">{externalDocumentationUrlText}</NavItem>
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
							<MenuItem>{Settings.fields.advisor.person.name} reports</MenuItem>
						</Link>
					</NavDropdown>
				}
			</BSNav>
		)
	}
}

const Nav = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseNav appSettings={context.appSettings} currentUser={context.currentUser} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(Nav)
