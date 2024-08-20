import { clearSearchQuery, resetPages } from "actions"
import AppContext from "components/AppContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import _isEmpty from "lodash/isEmpty"
import { Organization } from "models"
import {
  INSIGHT_DETAILS,
  INSIGHTS,
  PENDING_ASSESSMENTS_BY_POSITION
} from "pages/insights/Show"
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
  { key: "locations", label: "Merge locations" },
  { key: "organizations", label: "Merge organizations" }
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
  setIsMenuLinksOpened,
  isActive
}) => (
  <Nav.Item
    onClick={() => {
      handleOnClick?.()
      setIsMenuLinksOpened?.()
    }}
  >
    <LinkContainer to={linkTo} isActive={isActive}>
      <Nav.Link eventKey={id} active={false}>
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
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool
}

const SidebarContainer = ({
  linkTo,
  children,
  handleOnClick,
  setIsMenuLinksOpened
}) => {
  return (
    <LinkContainer
      to={linkTo}
      onClick={() => {
        handleOnClick?.()
        setIsMenuLinksOpened?.()
      }}
    >
      <NavDropdown.Item>{children}</NavDropdown.Item>
    </LinkContainer>
  )
}
SidebarContainer.propTypes = {
  linkTo: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  children: PropTypes.node,
  handleOnClick: PropTypes.func,
  setIsMenuLinksOpened: PropTypes.func
}

function hasAccessToInsight(currentUser, insight) {
  return (
    insight !== PENDING_ASSESSMENTS_BY_POSITION ||
    currentUser.hasAssignedPosition()
  )
}

const Navigation = ({ allOrganizations, resetPages, clearSearchQuery }) => {
  const { appSettings, currentUser, notifications } = useContext(AppContext)
  const [isMenuLinksOpened, setIsMenuLinksOpened] = useState(false)
  useEffect(() => scrollSpy.update(), [])

  const externalDocumentationUrl = appSettings.EXTERNAL_DOCUMENTATION_LINK_URL
  const externalDocumentationUrlText =
    appSettings.EXTERNAL_DOCUMENTATION_LINK_TEXT

  const routerLocation = useLocation()
  const path = routerLocation.pathname
  const inAdmin = path.startsWith("/admin")
  const inMerge = path.startsWith("/admin/merge")
  const inUserActivities = path.startsWith("/admin/userActivities")

  const [orgUuid, inOrg, myOrg, inMyOrg] = useMemo(() => {
    const inOrg = path.startsWith("/organizations")
    const orgUuid = inOrg ? path.split("/")[2] : null
    const myOrg = currentUser.position?.uuid
      ? currentUser.position?.organization
      : null
    const inMyOrg = orgUuid === myOrg?.uuid
    return [orgUuid, inOrg, myOrg, inMyOrg]
  }, [path, currentUser.position?.uuid, currentUser.position?.organization])

  const inMyCounterParts = path.startsWith("/positions/counterparts")
  const inMyTasks = path.startsWith("/tasks/mine")
  const inMyAuthorizationGroups = path.startsWith("/authorizationGroups/mine")
  const inMyReports = path.startsWith("/reports/mine")
  const inMySubscriptions = path.startsWith("/subscriptions/mine")
  const inInsights = path.startsWith("/insights")
  const inDashboards = path.startsWith("/dashboards")
  const inMySavedSearches = path.startsWith("/search/mine")

  const allOrganizationUuids = allOrganizations.map(o => o.uuid)

  const taskShortLabel = Settings.fields.task.shortLabel

  useEffect(() => {
    if (
      inMyOrg ||
      inMyCounterParts ||
      inMyReports ||
      inMyTasks ||
      inMyAuthorizationGroups ||
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
    inMyAuthorizationGroups,
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

          {currentUser.position?.uuid && (
            <>
              <SidebarLink
                id="my-tasks-nav"
                linkTo={{ pathname: "/tasks/mine" }}
                handleOnClick={resetPages}
              >
                {`My ${pluralize(taskShortLabel)}`}
                {!!notifications?.tasksWithPendingAssessments?.length && (
                  <NotificationBadge>
                    {notifications.tasksWithPendingAssessments.length}
                  </NotificationBadge>
                )}
              </SidebarLink>
              <SidebarLink
                id="my-counterparts-nav"
                linkTo={{ pathname: "/positions/counterparts" }}
                handleOnClick={resetPages}
              >
                My Counterparts
                {!!notifications?.counterpartsWithPendingAssessments
                  ?.length && (
                  <NotificationBadge>
                    {notifications.counterpartsWithPendingAssessments.length}
                  </NotificationBadge>
                )}
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
            id="my-attachments-nav"
            linkTo={{ pathname: "/attachments/mine" }}
            handleOnClick={resetPages}
          >
            My Attachments
          </SidebarLink>
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
          {!_isEmpty(
            currentUser?.position?.authorizationGroupsAdministrated
          ) && (
            <SidebarLink
              id="my-authorizationGroups-nav"
              linkTo={{ pathname: "/authorizationGroups/mine" }}
              handleOnClick={resetPages}
            >
              My Authorization Groups
            </SidebarLink>
          )}
        </div>
      </Collapse>

      <NavDropdown
        title={Settings.fields.regular.org.allOrgName}
        id="all-organizations"
        active={inOrg && allOrganizationUuids.includes(orgUuid) && !inMyOrg}
      >
        {Organization.map(allOrganizations, org => (
          <SidebarContainer
            key={org.uuid}
            linkTo={Organization.pathFor(org)}
            handleOnClick={clearSearchQuery}
            setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
          >
            {org.shortName}
          </SidebarContainer>
        ))}
      </NavDropdown>

      <Nav id="all-org-nav" style={{ lineHeight: "10px" }} />

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
          <SidebarLink
            id="admin-pages"
            linkTo="/admin"
            handleOnClick={() => {
              clearSearchQuery()
              setIsMenuLinksOpened(false)
            }}
            isActive={inAdmin}
          >
            Admin
          </SidebarLink>

          {inAdmin && (
            <Nav className="flex-column">
              <span id="style-nav" style={{ lineHeight: "10pt" }}>
                {!Settings.automaticallyAllowAllNewUsers && (
                  <SidebarLink
                    id="users-pending-verification"
                    linkTo="/admin/usersPendingVerification"
                    handleOnClick={resetPages}
                  >
                    Users pending verification
                  </SidebarLink>
                )}
                <NavDropdown title="Merge" id="merge" active={inMerge}>
                  {MERGE_OPTIONS.map(mergeOption => (
                    <SidebarContainer
                      key={mergeOption.key}
                      linkTo={`/admin/merge/${mergeOption.key}`}
                      handleOnClick={resetPages}
                    >
                      {mergeOption.label}
                    </SidebarContainer>
                  ))}
                </NavDropdown>
                <NavDropdown
                  title="User activities"
                  id="user-activities"
                  active={inUserActivities}
                >
                  {USER_ACTIVITY_OPTIONS.map(userActivityOption => (
                    <SidebarContainer
                      key={userActivityOption.key}
                      linkTo={`/admin/userActivities/${userActivityOption.key}`}
                    >
                      {userActivityOption.label}
                    </SidebarContainer>
                  ))}
                </NavDropdown>
                <SidebarLink
                  id="email-queue"
                  linkTo="/admin/pendingEmails"
                  handleOnClick={resetPages}
                >
                  Pending emails
                </SidebarLink>
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

      <NavDropdown title="Insights" id="insights" active={inInsights}>
        {INSIGHTS.filter(insight =>
          hasAccessToInsight(currentUser, insight)
        ).map(insight => (
          <SidebarContainer
            key={insight}
            linkTo={`/insights/${insight}`}
            handleOnClick={clearSearchQuery}
            setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
          >
            {INSIGHT_DETAILS[insight].navTitle}
          </SidebarContainer>
        ))}
      </NavDropdown>

      {Settings.dashboards && (
        <NavDropdown title="Dashboards" id="dashboards" active={inDashboards}>
          {Settings.dashboards.map(dashboard => (
            <SidebarContainer
              key={dashboard.label}
              linkTo={`/dashboards/${dashboard.type}/${dashboard.label}`}
              handleOnClick={clearSearchQuery}
              setIsMenuLinksOpened={() => setIsMenuLinksOpened(false)}
            >
              {dashboard.label}
            </SidebarContainer>
          ))}
        </NavDropdown>
      )}
    </Nav>
  )
}

Navigation.propTypes = {
  allOrganizations: PropTypes.array,
  clearSearchQuery: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired
}

Navigation.defaultProps = {
  allOrganizations: []
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
