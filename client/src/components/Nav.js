import { clearSearchQuery, resetPages } from "actions"
import { Settings } from "api"
import AppContext from "components/AppContext"
import { ResponsiveLayoutContext } from "components/ResponsiveLayout"
import { Organization, Person } from "models"
import { INSIGHTS, INSIGHT_DETAILS } from "pages/insights/Show"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { MenuItem, Nav as BSNav, NavDropdown, NavItem } from "react-bootstrap"
import { connect } from "react-redux"
import {
  IndexLinkContainer as Link,
  LinkContainer
} from "react-router-bootstrap"
import { useLocation } from "react-router-dom"
import { ScrollLink, scrollSpy } from "react-scroll"
import { bindActionCreators } from "redux"
import utils from "utils"

export const AnchorNavItem = ({ to, disabled, children }) => {
  const ScrollLinkNavItem = ScrollLink(NavItem)
  return (
    <ResponsiveLayoutContext.Consumer>
      {context => (
        <ScrollLinkNavItem
          activeClass="active"
          to={to}
          spy
          smooth
          duration={500}
          containerId="main-viewport"
          onClick={() => {
            context.showFloatingMenu(false)
            utils.pushHash(to)
          }}
          // TODO: fix the need for offset
          offset={-context.topbarOffset}
          disabled={disabled}
        >
          {children}
        </ScrollLinkNavItem>
      )}
    </ResponsiveLayoutContext.Consumer>
  )
}
AnchorNavItem.propTypes = {
  to: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node
}

const SidebarLink = ({ linkTo, children, handleOnClick, id }) => {
  return (
    <Link to={linkTo} onClick={handleOnClick}>
      <NavItem id={id}>{children}</NavItem>
    </Link>
  )
}
SidebarLink.propTypes = {
  linkTo: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  handleOnClick: PropTypes.func,
  id: PropTypes.string
}

const BaseNav = ({
  currentUser,
  organizations,
  appSettings,
  resetPages,
  clearSearchQuery
}) => {
  useEffect(() => scrollSpy.update(), [])

  const externalDocumentationUrl = appSettings.EXTERNAL_DOCUMENTATION_LINK_URL
  const externalDocumentationUrlText =
    appSettings.EXTERNAL_DOCUMENTATION_LINK_TEXT

  const routerLocation = useLocation()
  const path = routerLocation.pathname
  const inAdmin = path.indexOf("/admin") === 0
  const inOrg = path.indexOf("/organizations") === 0
  const inInsights = path.indexOf("/insights") === 0
  const inDashboards = path.indexOf("/dashboards") === 0

  const myOrg = currentUser.position ? currentUser.position.organization : null
  let orgUuid, myOrgUuid
  if (inOrg) {
    orgUuid = path.split("/")[2]
    myOrgUuid = myOrg && myOrg.uuid
  }

  return (
    <BSNav bsStyle="pills" stacked id="leftNav" className="hide-for-print">
      <SidebarLink linkTo="/" handleOnClick={resetPages}>
        Home
      </SidebarLink>

      <BSNav id="search-nav" />

      {currentUser.uuid && (
        <SidebarLink
          linkTo={{ pathname: "/reports/mine" }}
          handleOnClick={resetPages}
        >
          My reports
        </SidebarLink>
      )}

      <BSNav id="reports-nav" />

      {myOrg && (
        <SidebarLink
          linkTo={Organization.pathFor(myOrg)}
          handleOnClick={resetPages}
          id="my-organization"
        >
          My organization <br />
          <small>{myOrg.shortName}</small>
        </SidebarLink>
      )}

      <BSNav id="myorg-nav" />

      <NavDropdown
        title={Settings.fields.advisor.org.allOrgName}
        id="advisor-organizations"
        active={inOrg && orgUuid !== myOrgUuid}
      >
        {Organization.map(organizations, org => (
          <Link
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={clearSearchQuery}
          >
            <MenuItem>{org.shortName}</MenuItem>
          </Link>
        ))}
      </NavDropdown>

      <BSNav id="org-nav" />
      <SidebarLink linkTo="/rollup" handleOnClick={resetPages}>
        Daily rollup
      </SidebarLink>

      {process.env.NODE_ENV === "development" && (
        <SidebarLink linkTo="/graphiql" handleOnClick={resetPages}>
          GraphQL
        </SidebarLink>
      )}

      {currentUser.isAdmin() && (
        <LinkContainer to="/admin" onClick={clearSearchQuery}>
          <NavItem>Admin</NavItem>
        </LinkContainer>
      )}

      {inAdmin && (
        <BSNav>
          <LinkContainer to="/admin/mergePeople" onClick={resetPages}>
            <NavItem>Merge people</NavItem>
          </LinkContainer>
          <LinkContainer to="/admin/authorizationGroups" onClick={resetPages}>
            <NavItem>Authorization groups</NavItem>
          </LinkContainer>
        </BSNav>
      )}

      {externalDocumentationUrl && externalDocumentationUrlText && (
        <NavItem href={externalDocumentationUrl} target="_extdocs">
          {externalDocumentationUrlText}
        </NavItem>
      )}

      <SidebarLink linkTo="/help" handleOnClick={resetPages}>
        Help
      </SidebarLink>

      {currentUser.isAdmin() /* FIXME: enable this again when nci-agency/anet#1463 is fixed: || currentUser.isSuperUser() */ && (
        <NavDropdown title="Insights" id="insights" active={inInsights}>
          {INSIGHTS.map(insight => (
            <Link
              to={"/insights/" + insight}
              key={insight}
              onClick={clearSearchQuery}
            >
              <MenuItem>{INSIGHT_DETAILS[insight].navTitle}</MenuItem>
            </Link>
          ))}
        </NavDropdown>
      )}

      {Settings.dashboards && (
        <NavDropdown title="Dashboards" id="dashboards" active={inDashboards}>
          {Settings.dashboards.map(dashboard => (
            <Link
              to={`/dashboards/${dashboard.type}/${dashboard.label}`}
              key={dashboard.label}
              onClick={clearSearchQuery}
            >
              <MenuItem>{dashboard.label}</MenuItem>
            </Link>
          ))}
        </NavDropdown>
      )}
    </BSNav>
  )
}

BaseNav.propTypes = {
  currentUser: PropTypes.instanceOf(Person),
  appSettings: PropTypes.object,
  organizations: PropTypes.array,
  clearSearchQuery: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired
}

BaseNav.defaultProps = {
  appSettings: {},
  organizations: []
}

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      clearSearchQuery: () => clearSearchQuery(),
      resetPages: () => resetPages()
    },
    dispatch
  )

const Nav = props => (
  <AppContext.Consumer>
    {context => (
      <BaseNav
        appSettings={context.appSettings}
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default connect(null, mapDispatchToProps, null, {
  pure: false
})(Nav)
