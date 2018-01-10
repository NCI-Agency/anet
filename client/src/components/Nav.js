import React, {Component, PropTypes} from 'react'
import {Nav as BSNav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import {IndexLinkContainer as Link} from 'react-router-bootstrap'
import {Injectable, Injector} from 'react-injectables'
import {Scrollspy} from 'react-scrollspy'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import pluralize from 'pluralize'

import {Organization} from 'models'

class Nav extends Component {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	render() {
		const injections = this.props.injections
		if (injections && injections.length) {
			return <div>{injections}</div>
		}

		const appData = this.context.app.state
		const currentUser = appData.currentUser
		const organizations = appData.organizations || []
		let path = this.context.app.props.location.pathname

		const {settings} = appData || {}
		const externalDocumentationUrl = settings.EXTERNAL_DOCUMENTATION_LINK_URL
		const externalDocumentationUrlText = settings.EXTERNAL_DOCUMENTATION_LINK_TEXT

		const inAdmin = path.indexOf('/admin') === 0
		const inOrg = path.indexOf('/organizations') === 0
		const inMyReports = path.indexOf('/reports/mine') === 0
		const inInsights = path.indexOf('/insights') === 0

		const myOrg = currentUser.position.organization
		let orgId, myOrgId
		if (inOrg) {
			orgId = +this.context.app.props.params.id
			myOrgId = myOrg && +myOrg.id
			path = `/organizations/${orgId}`
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
				<AnchorLink scrollTo="tasks">{pluralize(Settings.TASK.shortLabel)}</AnchorLink>
				<AnchorLink scrollTo="reports">Reports</AnchorLink>
			</SubNav>
		)

		return (
			<BSNav bsStyle="pills" stacked id="leftNav" className="nav-fixed">
				<Link to="/">
					<NavItem>Home</NavItem>
				</Link>

				{currentUser.id && <Link to={{pathname: '/reports/mine'}}>
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

				{inOrg && orgId === myOrgId && orgSubNav}

				<NavDropdown title={Settings.NAV_BAR_ALL_ADVISOR_ORGS} id="organizations" active={inOrg && orgId !== myOrgId}>
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
					<SubNav>
						<Link to={"/admin/mergePeople"}><NavItem>Merge people</NavItem></Link>
					</SubNav>
				}
				
				{externalDocumentationUrl && externalDocumentationUrlText &&
					<li role="presentation">
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

let InjectableNav = null
let ContentForNav = null
if (process.env.NODE_ENV === 'test') {
	ContentForNav = function(props) {
		return <div />
	}
} else {
	// this is some magic around the Injectable library to allow
	// components further down the tree to inject children into the header
	InjectableNav = Injectable(Nav)

	const NavInjector = Injector({into: InjectableNav})
	ContentForNav = function(props) {
		let {children, ...childProps} = props
		let Component = NavInjector(function() { return children })
		return <Component {...childProps} />
	}
}

export default InjectableNav
export {ContentForNav}
