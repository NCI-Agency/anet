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
import {INSIGHTS, INSIGHT_DETAILS} from 'pages/insights/Show'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'

class BaseNav extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		appSettings: PropTypes.object,
		organizations: PropTypes.array,
		scrollspyOffset: PropTypes.number,
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
		let orgId, myOrgId
		if (inOrg) {
			orgId = +path.split('/')[2]
			myOrgId = myOrg && +myOrg.id
		}

		return (
			<BSNav bsStyle="pills" stacked id="leftNav" className="nav-fixed">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				<NavWrap id="search-nav"></NavWrap>

				{currentUser.id && <Link to={{pathname: '/reports/mine'}}>
					<NavItem>My reports</NavItem>
				</Link>}

				{inMyReports &&
					<NavWrap>
						<Scrollspy className="nav" currentClassName="active" offset={this.props.scrollspyOffset}
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

				<NavWrap id="myorg-nav"></NavWrap>

				<NavDropdown title={Settings.fields.advisor.org.allOrgName} id="advisor-organizations" active={inOrg && orgId !== myOrgId}>
					{Organization.map(organizations, org =>
						<LinkTo organization={org} componentClass={Link} key={org.id}>
							<MenuItem>{org.shortName}</MenuItem>
						</LinkTo>
					)}
				</NavDropdown>

				<NavWrap id="org-nav"></NavWrap>

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
						{INSIGHTS.map(insight =>
							<Link to={"/insights/" + insight} key={insight}>
								<MenuItem>{INSIGHT_DETAILS[insight].navTitle}</MenuItem>
							</Link>)
						}
					</NavDropdown>
				}
			</BSNav>
		)
	}
}

const Nav = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseNav appSettings={context.appSettings} currentUser={context.currentUser} scrollspyOffset={context.scrollspyOffset} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(Nav)
