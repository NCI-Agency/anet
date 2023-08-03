import { clearSearchQuery, resetPages } from "actions"
import AppContext from "components/AppContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import { Organization } from "models"
import { INSIGHT_DETAILS, INSIGHTS } from "pages/insights/Show"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { Badge, Collapse, Nav, NavDropdown } from "react-bootstrap"
import { connect } from "react-redux"
import { LinkContainer } from "react-router-bootstrap"
import { useLocation } from "react-router-dom"
import { ScrollLink, scrollSpy } from "react-scroll"
import { bindActionCreators } from "redux"
import Settings from "settings"
import utils from "utils"

const MERGE_OPTIONS = [
  { key: "people", label: "Merge people" },
  { key: "positions", label: "Merge positions" },
  { key: "locations", label: "Merge locations" }
]

const USER_ACTIVITY_OPTIONS = [
  { key: "overTime", label: "Over time" },
  { key: "perPeriod", label: "Per period" }
]

export const AnchorNavItem = ({ to, disabled, children }) => {
  const { showFloatingMenu, topbarOffset } = useContext(ResponsiveLayoutContext)
  const ScrollLinkNavItem = ScrollLink(Nav.Link)
  return (
    <ScrollLinkNavItem
      activeClass="active"
      to={to}
      spy
      smooth
      duration={500}
      containerId="main-viewport"
      onClick={() => {
        showFloatingMenu(false)
        utils.pushHash(to)
      }}
      // TODO: fix the need for offset
      offset={-topbarOffset}
      disabled={disabled}
    >
      {children}
    </ScrollLinkNavItem>
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
  <Nav.Item
    onClick={() => {
      handleOnClick()
      setIsMenuLinksOpened && setIsMenuLinksOpened()
    }}
  >
    <LinkContainer to={linkTo}>
      <Nav.Link eventKey={id}>
        <span>{children}</span>
      </Nav.Link>
    </LinkContainer>
  </Nav.Item>
)
SidebarLink.propTypes = {
  linkTo: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  handleOnClick: PropTypes.func,
  setIsMenuLinksOpened: PropTypes.func,
  id: PropTypes.string.isRequired
}

const Navigation = ({
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
  const inMerge = path.indexOf("/admin/merge") === 0
  const inUserActivities = path.indexOf("/admin/userActivities") === 0

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
    <Nav variant="pills" id="leftNav" className="flex-column d-print-none">
      <SidebarLink
        id="nav-home-button"
        linkTo="/"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Home
      </SidebarLink>

      <Nav id="search-nav" />

      <Nav.Item
        id={isMenuLinksOpened ? "nav-links-opened" : ""}
        active={isMenuLinksOpened ? 1 : 0}
        style={{ paddingTop: "2px" }}
        onClick={() => setIsMenuLinksOpened(!isMenuLinksOpened)}
      >
        <Nav.Link>
          {Settings?.menuOptions?.menuLinksDropdownTitle ?? "My Work"}
          <span
            className={
              isMenuLinksOpened
                ? "dropdown-toggle dropdown-toggle-rotate"
                : "dropdown-toggle"
            }
            style={{ marginLeft: "0.255em" }}
          />
        </Nav.Link>
      </Nav.Item>

      <Collapse in={isMenuLinksOpened}>
        <div style={{ marginLeft: "1rem" }}>
          {currentUser.uuid && (
            <SidebarLink
              id="my-reports-nav"
              linkTo={{ pathname: "/reports/mine" }}
              handleOnClick={resetPages}
            >
              My Reports
            </SidebarLink>
          )}

          <Nav id="reports-nav" style={{ lineHeight: "10px" }} />

          {isAdvisor && currentUser.position?.uuid && (
            <>
              <SidebarLink
                id="my-tasks-nav"
                linkTo={{ pathname: "/tasks/mine" }}
                handleOnClick={resetPages}
              >
                {`My ${pluralize(taskShortLabel)}`}
                {notifications?.tasksWithPendingAssessments?.length ? (
                  <NotificationBadge>
                    {notifications.tasksWithPendingAssessments.length}
                  </NotificationBadge>
                ) : null}
              </SidebarLink>
              <SidebarLink
                id="my-counterparts-nav"
                linkTo={{ pathname: "/positions/counterparts" }}
                handleOnClick={resetPages}
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
              id="my-organization-nav"
              linkTo={Organization.pathFor(myOrg)}
              handleOnClick={resetPages}
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
        </div>
      </Collapse>

      <NavDropdown
        title={Settings.fields.advisor.org.allOrgName}
        id="advisor-organizations"
        active={inOrg && advisorOrganizationUuids.includes(orgUuid) && !inMyOrg}
      >
        {Organization.map(advisorOrganizations, org => (
          <LinkContainer
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
          >
            <NavDropdown.Item>{org.shortName}</NavDropdown.Item>
          </LinkContainer>
        ))}
      </NavDropdown>

      <Nav id="advisor-org-nav" style={{ lineHeight: "10px" }} />

      <NavDropdown
        title={Settings.fields.principal.org.allOrgName}
        id="principal-organizations"
        active={
          inOrg && principalOrganizationUuids.includes(orgUuid) && !inMyOrg
        }
      >
        {Organization.map(principalOrganizations, org => (
          <LinkContainer
            to={Organization.pathFor(org)}
            key={org.uuid}
            onClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
          >
            <NavDropdown.Item>{org.shortName}</NavDropdown.Item>
          </LinkContainer>
        ))}
      </NavDropdown>

      <Nav id="principal-org-nav" style={{ lineHeight: "10px" }} />

      <SidebarLink
        id="daily-rollup-nav"
        linkTo="/rollup"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Daily Rollup
      </SidebarLink>

      {currentUser.isAdmin() && (
        <Nav.Item>
          <LinkContainer
            to="/admin"
            onClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
            isActive={inAdmin}
          >
            <Nav.Link>Admin</Nav.Link>
          </LinkContainer>

          {inAdmin && (
            <Nav className="flex-column">
              <span id="style-nav" style={{ lineHeight: "10pt" }}>
                <NavDropdown title="Merge" id="merge" active={inMerge}>
                  {MERGE_OPTIONS.map(mergeOption => (
                    <LinkContainer
                      to={`/admin/merge/${mergeOption.key}`}
                      key={mergeOption.key}
                      onClick={resetPages}
                    >
                      <NavDropdown.Item>{mergeOption.label}</NavDropdown.Item>
                    </LinkContainer>
                  ))}
                </NavDropdown>
                <Nav.Item>
                  <LinkContainer
                    to="/admin/authorizationGroups"
                    onClick={resetPages}
                  >
                    <Nav.Link>Authorization groups</Nav.Link>
                  </LinkContainer>
                </Nav.Item>
                <NavDropdown
                  title="User activities"
                  id="user-activities"
                  active={inUserActivities}
                >
                  {USER_ACTIVITY_OPTIONS.map(userActivityOption => (
                    <LinkContainer
                      to={`/admin/userActivities/${userActivityOption.key}`}
                      key={userActivityOption.key}
                    >
                      <NavDropdown.Item>
                        {userActivityOption.label}
                      </NavDropdown.Item>
                    </LinkContainer>
                  ))}
                </NavDropdown>
                <SidebarLink
                  id="graphQL-nav"
                  linkTo="/admin/graphiql"
                  handleOnClick={resetPages}
                >
                  GraphQL
                </SidebarLink>
              </span>
            </Nav>
          )}
        </Nav.Item>
      )}

      {externalDocumentationUrl && externalDocumentationUrlText && (
        <Nav.Item>
          <Nav.Link href={externalDocumentationUrl} target="_extdocs">
            {externalDocumentationUrlText}
          </Nav.Link>
        </Nav.Item>
      )}

      <SidebarLink
        id="help-nav"
        linkTo="/help"
        handleOnClick={resetPages}
        setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
      >
        Help
      </SidebarLink>

      {(currentUser.isAdmin() || currentUser.isSuperuser()) && (
        <NavDropdown title="Insights" id="insights" active={inInsights}>
          {INSIGHTS.map(insight => (
            <LinkContainer
              to={`/insights/${insight}`}
              key={insight}
              onClick={() => {
                clearSearchQuery()
                setIsMenuLinksOpened(false)
              }}
            >
              <NavDropdown.Item>
                {INSIGHT_DETAILS[insight].navTitle}
              </NavDropdown.Item>
            </LinkContainer>
          ))}
        </NavDropdown>
      )}

      {Settings.dashboards && (
        <NavDropdown title="Dashboards" id="dashboards" active={inDashboards}>
          {Settings.dashboards.map(dashboard => (
            <LinkContainer
              to={`/dashboards/${dashboard.type}/${dashboard.label}`}
              key={dashboard.label}
              onClick={() => {
                clearSearchQuery()
                setIsMenuLinksOpened(false)
              }}
            >
              <NavDropdown.Item>{dashboard.label}</NavDropdown.Item>
            </LinkContainer>
          ))}
        </NavDropdown>
      )}
    </Nav>
  )
}

Navigation.propTypes = {
  advisorOrganizations: PropTypes.array,
  principalOrganizations: PropTypes.array,
  clearSearchQuery: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired
}

Navigation.defaultProps = {
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

export default connect(null, mapDispatchToProps)(Navigation)
