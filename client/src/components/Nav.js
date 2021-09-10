import { Collapse } from "@blueprintjs/core"
import { clearSearchQuery, resetPages } from "actions"
import AppContext from "components/AppContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import { Organization } from "models"
import { INSIGHTS, INSIGHT_DETAILS } from "pages/insights/Show"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useEffect, useMemo, useState } from "react"
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

const SidebarLink = ({
  linkTo,
  children,
  handleOnClick,
  id,
  setIsMenuLinksOpened
}) => (
  <Link
    to={linkTo}
    onClick={() => {
      handleOnClick()
      setIsMenuLinksOpened && setIsMenuLinksOpened()
    }}
  >
    <NavItem id={id}>{children}</NavItem>
  </Link>
)
SidebarLink.propTypes = {
  linkTo: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  handleOnClick: PropTypes.func,
  setIsMenuLinksOpened: PropTypes.func,
  id: PropTypes.string
}

const Nav = ({
  advisorOrganizations,
  principalOrganizations,
  resetPages,
  clearSearchQuery
}) => {
  const { appSettings, currentUser, notifications } = useContext(AppContext)
  const [isMenuLinksOpened, setIsMenuLinksOpened] = useState(false)
  useEffect(() => scrollSpy.update(), [])

  const externalDocumentationUrl = appSettings.EXTERNAL_DOCUMENTATION_LINK_URL
  const externalDocumentationUrlText =
    appSettings.EXTERNAL_DOCUMENTATION_LINK_TEXT

  const routerLocation = useLocation()
  const path = routerLocation.pathname
  const inAdmin = path.indexOf("/admin") === 0

  const [orgUuid, inOrg, myOrg, inMyOrg] = useMemo(() => {
    const inOrg = path.indexOf("/organizations") === 0
    const orgUuid = inOrg ? path.split("/")[2] : null
    const myOrg = currentUser.position?.uuid
      ? currentUser.position?.organization
      : null
    const inMyOrg = orgUuid === myOrg?.uuid
    return [orgUuid, inOrg, myOrg, inMyOrg]
  }, [path, currentUser.position?.uuid, currentUser.position?.organization])

  const inMyCounterParts = path.indexOf("/positions/counterparts") === 0
  const inMyTasks = path.indexOf("/tasks/mine") === 0
  const inMyReports = path.indexOf("/reports/mine") === 0
  const inMySubscriptions = path.indexOf("/subscriptions/mine") === 0
  const inInsights = path.indexOf("/insights") === 0
  const inDashboards = path.indexOf("/dashboards") === 0
  const inMySavedSearches = path.indexOf("/search/mine") === 0

  const advisorOrganizationUuids = advisorOrganizations.map(o => o.uuid)
  const principalOrganizationUuids = principalOrganizations.map(o => o.uuid)

  const isAdvisor = currentUser.isAdvisor()
  const taskShortLabel = Settings.fields.task.shortLabel

  useEffect(() => {
    if (
      inMyOrg ||
      inMyCounterParts ||
      inMyReports ||
      inMyTasks ||
      inMySubscriptions ||
      inMySavedSearches
    ) {
      setIsMenuLinksOpened(true)
    }
  }, [
    inMyOrg,
    inMyCounterParts,
    inMyReports,
    inMyTasks,
    inMySubscriptions,
    inMySavedSearches
  ])

  return (
    <BSNav bsStyle="pills" stacked id="leftNav" className="hide-for-print">
      <SidebarLink
        linkTo="/"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Home
      </SidebarLink>

      <BSNav id="search-nav" />

      <NavItem
        active={isMenuLinksOpened}
        id="nav-links-button"
        style={{ paddingTop: "2px" }}
        onClick={() => setIsMenuLinksOpened(!isMenuLinksOpened)}
      >
        {Settings?.menuOptions?.menuLinksDropdownTitle ?? "My Work"}
        <span
          className={isMenuLinksOpened ? "caret caret-rotate" : "caret"}
          style={{ marginLeft: "0.5rem" }}
        >
        </span>
      </NavItem>

      <Collapse isOpen={isMenuLinksOpened}>
        <BSNav
          bsStyle="pills"
          stacked
          style={{ paddingLeft: "1rem", paddingTop: "2px" }}
        >
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
          <SidebarLink
            linkTo={{ pathname: "/subscriptions/mine" }}
            handleOnClick={resetPages}
            id="my-subscriptions"
          >
            My Subscriptions
          </SidebarLink>
          <SidebarLink
            linkTo={{ pathname: "/search/mine" }}
            handleOnClick={resetPages}
            id="my-searches"
          >
            My Saved Searches
          </SidebarLink>
        </BSNav>
      </Collapse>

      <NavDropdown
        title={Settings.fields.advisor.org.allOrgName}
        id="advisor-organizations"
        active={inOrg && advisorOrganizationUuids.includes(orgUuid) && !inMyOrg}
      >
        {Organization.map(advisorOrganizations, org => (
          <Link
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
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
          inOrg && principalOrganizationUuids.includes(orgUuid) && !inMyOrg
        }
      >
        {Organization.map(principalOrganizations, org => (
          <Link
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
          >
            <MenuItem>{org.shortName}</MenuItem>
          </Link>
        ))}
      </NavDropdown>

      <BSNav id="principal-org-nav" />

      <SidebarLink
        linkTo="/rollup"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Daily Rollup
      </SidebarLink>

      {currentUser.isAdmin() && (
        <LinkContainer
          to="/admin"
          onClick={() => {
            clearSearchQuery()
            setIsMenuLinksOpened(false)
          }}
        >
          <NavItem>Admin</NavItem>
        </LinkContainer>
      )}

      {inAdmin && (
        <BSNav>
          <LinkContainer to="/admin/mergePeople" onClick={resetPages}>
            <NavItem>Merge people</NavItem>
          </LinkContainer>
          <LinkContainer to="/admin/mergePositions" onClick={resetPages}>
            <NavItem>Merge positions</NavItem>
          </LinkContainer>
          <LinkContainer to="/admin/mergeLocations" onClick={resetPages}>
            <NavItem>Merge locations</NavItem>
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

      <SidebarLink
        linkTo="/help"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Help
      </SidebarLink>

      {(currentUser.isAdmin() || currentUser.isSuperUser()) && (
        <NavDropdown title="Insights" id="insights" active={inInsights}>
          {INSIGHTS.map(insight => (
            <Link
              to={"/insights/" + insight}
              key={insight}
              onClick={() => {
                clearSearchQuery()
                setIsMenuLinksOpened(false)
              }}
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
              onClick={() => {
                clearSearchQuery()
                setIsMenuLinksOpened(false)
              }}
            >
              <MenuItem>{dashboard.label}</MenuItem>
            </Link>
          ))}
        </NavDropdown>
      )}

      {Settings.keycloakConfiguration.showLogoutLink && (
        <NavItem href="/api/logout" onClick={resetPages}>
          Logout
        </NavItem>
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
