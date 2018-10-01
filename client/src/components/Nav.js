import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {Nav as BSNav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import {IndexLinkContainer as Link} from 'react-router-bootstrap'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import pluralize from 'pluralize'

import {Organization, Person} from 'models'
import {INSIGHTS, INSIGHT_DETAILS} from 'pages/insights/Show'

import AppContext from 'components/AppContext'
import { withRouter } from 'react-router-dom'

import {ScrollLink, scrollSpy} from 'react-scroll'

class BaseNav extends Component {
	static propTypes = {
		currentUser: PropTypes.instanceOf(Person),
		appSettings: PropTypes.object,
		showFloatingMenu: PropTypes.func,
		organizations: PropTypes.array,
		topbarOffset: PropTypes.number.isRequired,
	}

	componentDidMount() {
		scrollSpy.update()
	}

	render() {
		const { currentUser, topbarOffset } = this.props
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

		const showFloatingMenu = this.props.showFloatingMenu
		const ScrollLinkNavItem = ScrollLink(NavItem)
		const AnchorNavItem = function(props) {
			const {to, ...remainingProps} = props
			return <ScrollLinkNavItem
					activeClass="active"
					to={to}
					spy={true}
					hashSpy={true}
					smooth={true}
					duration={500}
					containerId="main-viewport"
					offset={-topbarOffset}
					onClick={() => {
						showFloatingMenu(false)
					}}
					{...remainingProps}>
						{props.children}
				</ScrollLinkNavItem>
			//TODO: fix the need for offset
		}

		const orgSubNav = (
			<BSNav>
				<AnchorNavItem to="info" >Info</AnchorNavItem>
				<AnchorNavItem to="supportedPositions" >Supported positions</AnchorNavItem>
				<AnchorNavItem to="vacantPositions" >Vacant positions</AnchorNavItem>
				<AnchorNavItem to="approvals" >Approvals</AnchorNavItem>
				<AnchorNavItem to="tasks" >{pluralize(Settings.fields.task.shortLabel)}</AnchorNavItem>
				<AnchorNavItem to="reports" >Reports</AnchorNavItem>
			</BSNav>
		)

		return (
			<BSNav bsStyle="pills" stacked id="leftNav" className="hide-for-print">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				<BSNav id="search-nav"></BSNav>

				{currentUser.id && <Link to={{pathname: '/reports/mine'}}>
					<NavItem>My reports</NavItem>
				</Link>}

				{inMyReports &&
					<BSNav>
						<AnchorNavItem to="draft-reports">Draft reports</AnchorNavItem>
						<AnchorNavItem to="upcoming-engagements">Upcoming Engagements</AnchorNavItem>
						<AnchorNavItem to="pending-approval">Pending approval</AnchorNavItem>
						<AnchorNavItem to="published-reports">Published reports</AnchorNavItem>
					</BSNav>
				}

				{myOrg && <Link to={Organization.pathFor(myOrg)}>
					<NavItem id="my-organization">My organization <br /><small>{myOrg.shortName}</small></NavItem>
				</Link>}

				<BSNav id="myorg-nav"></BSNav>

				<NavDropdown title={Settings.fields.advisor.org.allOrgName} id="advisor-organizations" active={inOrg && orgId !== myOrgId}>
					{Organization.map(organizations, org =>
						<LinkTo organization={org} componentClass={Link} key={org.id}>
							<MenuItem>{org.shortName}</MenuItem>
						</LinkTo>
					)}
				</NavDropdown>

				<BSNav id="org-nav"></BSNav>

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
					<BSNav>
						<Link to={"/admin/mergePeople"}><NavItem>Merge people</NavItem></Link>
						<Link to={"/admin/authorizationGroups"}><NavItem>Authorization groups</NavItem></Link>
					</BSNav>
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
			<BaseNav appSettings={context.appSettings} currentUser={context.currentUser} showFloatingMenu={context.showFloatingMenu} {...props} />
		}
	</AppContext.Consumer>
)

export default withRouter(Nav)
