import { clearSearchQuery, resetPages } from "actions"
import AppContext from "components/AppContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import { Organization } from "models"
import { INSIGHTS, INSIGHT_DETAILS } from "pages/insights/Show"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useEffect } from "react"
import {
  Badge,
  MenuItem,
  Nav as BSNav,
  NavDropdown,
  NavItem
} from "react-bootstrap"
import { connect } from "react-redux"
import {
  IndexLinkContainer as Link,
  LinkContainer
} from "react-router-bootstrap"
import { useLocation } from "react-router-dom"
import { ScrollLink, scrollSpy } from "react-scroll"
import { bindActionCreators } from "redux"
import Settings from "settings"
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

const SidebarLink = ({ linkTo, children, handleOnClick, id }) => (
  <Link to={linkTo} onClick={handleOnClick}>
    <NavItem id={id}>{children}</NavItem>
  </Link>
)
SidebarLink.propTypes = {
  linkTo: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  handleOnClick: PropTypes.func,
  id: PropTypes.string
}

const Nav = ({
  advisorOrganizations,
  principalOrganizations,
  resetPages,
  clearSearchQuery
}) => {
  const { appSettings, currentUser, notifications } = useContext(AppContext)
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

  const myOrg = currentUser.position?.uuid
    ? currentUser.position?.organization
    : null
  let orgUuid, myOrgUuid
  if (inOrg) {
    orgUuid = path.split("/")[2]
    myOrgUuid = myOrg && myOrg.uuid
  }

  const advisorOrganizationUuids = advisorOrganizations.map(o => o.uuid)
  const principalOrganizationUuids = principalOrganizations.map(o => o.uuid)

  const isAdvisor = currentUser.isAdvisor()
  const taskShortLabel = Settings.fields.task.shortLabel

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
          My Reports
        </SidebarLink>
      )}

      <BSNav id="reports-nav" />

      {isAdvisor && currentUser.position?.uuid && (
        <>
          <SidebarLink
            linkTo={{ pathname: "/tasks/mine" }}
            handleOnClick={resetPages}
            id="my-tasks-nav"
          >
            {`My ${pluralize(taskShortLabel)}`}
            {notifications?.tasksWithPendingAssessments?.length ? (
              <NotificationBadge>
                {notifications.tasksWithPendingAssessments.length}
              </NotificationBadge>
            ) : null}
          </SidebarLink>
          <SidebarLink
            linkTo={{ pathname: "/positions/counterparts" }}
            handleOnClick={resetPages}
            id="my-counterparts-nav"
          >
            My Counterparts
            {notifications?.counterpartsWithPendingAssessments?.length ? (
              <NotificationBadge>
                {notifications.counterpartsWithPendingAssessments.length}
              </NotificationBadge>
            ) : null}
          </SidebarLink>
        </>
      )}

      {myOrg && (
        <SidebarLink
          linkTo={Organization.pathFor(myOrg)}
          handleOnClick={resetPages}
          id="my-organization"
        >
          My Organization <br />
          <small>{myOrg.shortName}</small>
        </SidebarLink>
      )}
      <BSNav id="myorg-nav" />

      <NavDropdown
        title={Settings.fields.advisor.org.allOrgName}
        id="advisor-organizations"
        active={
          inOrg &&
          advisorOrganizationUuids.includes(orgUuid) &&
          orgUuid !== myOrgUuid
        }
      >
        {Organization.map(advisorOrganizations, org => (
          <Link
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={clearSearchQuery}
          >
            <MenuItem>{org.shortName}</MenuItem>
          </Link>
        ))}
      </NavDropdown>

      <BSNav id="advisor-org-nav" />

      <NavDropdown
        title={Settings.fields.principal.org.allOrgName}
        id="principal-organizations"
        active={
          inOrg &&
          principalOrganizationUuids.includes(orgUuid) &&
          orgUuid !== myOrgUuid
        }
      >
        {Organization.map(principalOrganizations, org => (
          <Link
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={clearSearchQuery}
          >
            <MenuItem>{org.shortName}</MenuItem>
          </Link>
        ))}
      </NavDropdown>

      <BSNav id="principal-org-nav" />

      <SidebarLink linkTo="/rollup" handleOnClick={resetPages}>
        Daily Rollup
      </SidebarLink>

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
          <SidebarLink linkTo="/admin/graphiql" handleOnClick={resetPages}>
            GraphQL
          </SidebarLink>
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

      {(currentUser.isAdmin() || currentUser.isSuperUser()) && (
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

Nav.propTypes = {
  advisorOrganizations: PropTypes.array,
  principalOrganizations: PropTypes.array,
  clearSearchQuery: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired
}

Nav.defaultProps = {
  advisorOrganizations: [],
  principalOrganizations: []
}

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      clearSearchQuery: () => clearSearchQuery(),
      resetPages: () => resetPages()
    },
    dispatch
  )

const NotificationBadge = ({ children }) => {
  return (
    <Badge
      style={{
        float: "right",
        marginRight: "2px"
      }}
    >
      {children}
    </Badge>
  )
}

NotificationBadge.propTypes = {
  children: PropTypes.node
}

export default connect(null, mapDispatchToProps, null, {
  pure: false
})(Nav)
