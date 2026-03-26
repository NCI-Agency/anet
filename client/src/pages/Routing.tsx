import ProtectedRoute from "components/ProtectedRoute"
import ResponsiveLayout from "components/ResponsiveLayout"
import _isEmpty from "lodash/isEmpty"
import AccessTokensList from "pages/admin/accessTokens/Index"
import AuditTrailTable from "pages/admin/auditTrail/Index"
import ConfigureEventTypesShow from "pages/admin/configureEventTypes/Show"
import AdminIndex from "pages/admin/Index"
import MartImporterShow from "pages/admin/martImporter/Show"
import MergeLocations from "pages/admin/merge/MergeLocations"
import MergeOrganizations from "pages/admin/merge/MergeOrganizations"
import MergePeople from "pages/admin/merge/MergePeople"
import MergePositions from "pages/admin/merge/MergePositions"
import MergeTasks from "pages/admin/merge/MergeTasks"
import PendingEmailsShow from "pages/admin/pendingEmails/Show"
import Preferences from "pages/admin/preferences/Preferences"
import UserActivitiesOverTime from "pages/admin/useractivities/UserActivitiesOverTime"
import UserActivitiesPerPeriod from "pages/admin/useractivities/UserActivitiesPerPeriod"
import UsersPendingVerification from "pages/admin/UsersPendingVerification"
import AttachmentEdit from "pages/attachments/Edit"
import MyAttachments from "pages/attachments/MyAttachments"
import AttachmentShow from "pages/attachments/Show"
import AuthorizationGroupEdit from "pages/authorizationGroups/Edit"
import MyAuthorizationGroups from "pages/authorizationGroups/MyAuthorizationGroups"
import AuthorizationGroupNew from "pages/authorizationGroups/New"
import AuthorizationGroupShow from "pages/authorizationGroups/Show"
import DecisivesDashboard from "pages/dashboards/DecisivesDashboard"
import KanbanDashboard from "pages/dashboards/KanbanDashboard"
import EventEdit from "pages/events/Edit"
import EventsList from "pages/events/List"
import MyEvents from "pages/events/MyEvents"
import EventNew from "pages/events/New"
import EventShow from "pages/events/Show"
import EventSeriesEdit from "pages/eventSeries/Edit"
import EventSeriesNew from "pages/eventSeries/New"
import EventSeriesShow from "pages/eventSeries/Show"
import GraphiQL from "pages/GraphiQL"
import Help from "pages/Help"
import Home from "pages/Home"
import InsightsShow from "pages/insights/Show"
import LocationEdit from "pages/locations/Edit"
import LocationNew from "pages/locations/New"
import LocationShow from "pages/locations/Show"
import OnboardingEdit from "pages/onboarding/Edit"
import OnboardingNew from "pages/onboarding/New"
import OnboardingShow from "pages/onboarding/Show"
import OrganizationEdit from "pages/organizations/Edit"
import OrganizationNew from "pages/organizations/New"
import OrganizationShow from "pages/organizations/Show"
import PageMissing from "pages/PageMissing"
import PersonCompact from "pages/people/Compact"
import PersonEdit from "pages/people/Edit"
import PersonNew from "pages/people/New"
import PersonShow from "pages/people/Show"
import PositionEdit from "pages/positions/Edit"
import MyCounterparts from "pages/positions/MyCounterparts"
import PositionNew from "pages/positions/New"
import PositionShow from "pages/positions/Show"
import MyPreferences from "pages/preferences/MyPreferences"
import ReportCompact from "pages/reports/Compact"
import ReportEdit from "pages/reports/Edit"
import MyReports from "pages/reports/MyReports"
import ReportNew from "pages/reports/New"
import ReportShow from "pages/reports/Show"
import RollupShow from "pages/rollup/Show"
import MySavedSearches from "pages/searches/MySavedSearches"
import Search from "pages/searches/Search"
import MySubscriptions from "pages/subscriptions/Mine"
import TaskEdit from "pages/tasks/Edit"
import MyTasks from "pages/tasks/MyTasks"
import TaskNew from "pages/tasks/New"
import TaskShow from "pages/tasks/Show"
import TopTasks from "pages/tasks/Top"
import { PAGE_URLS } from "pages/util"
import React from "react"
import { Navigate } from "react-router"
import Settings from "settings"

const routes = [
  {
    element: <ResponsiveLayout />,
    children: [
      { index: true, path: PAGE_URLS.HOME, element: <Home /> },
      { path: PAGE_URLS.ROLLUP, element: <RollupShow /> },
      { path: PAGE_URLS.HELP, element: <Help /> },
      {
        path: PAGE_URLS.SEARCH,
        children: [
          { index: true, element: <Search /> },
          { path: "mine", element: <MySavedSearches /> }
        ]
      },
      {
        path: PAGE_URLS.REPORTS,
        children: [
          { path: "mine", element: <MyReports /> },
          { path: "new", element: <ReportNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <ReportShow /> },
              { path: "compact", element: <ReportCompact /> },
              { path: "edit", element: <ReportEdit /> },
              /* TODO: Backwards-compatibility; this route can be removed at some point */
              { path: "min", element: <ReportShow /> }
            ]
          }
        ]
      },
      {
        element: (
          <ProtectedRoute
            authorizationCallback={() =>
              !Settings.fields.attachment.featureDisabled
            }
          />
        ),
        children: [
          {
            path: PAGE_URLS.ATTACHMENTS,
            children: [
              { path: "mine", element: <MyAttachments /> },
              {
                path: ":uuid",
                children: [
                  { index: true, element: <AttachmentShow /> },
                  {
                    element: (
                      <ProtectedRoute
                        authorizationCallback={currentUser =>
                          !Settings.fields.attachment.featureDisabled &&
                          (!Settings.fields.attachment.restrictToAdmins ||
                            currentUser.isAdmin())
                        }
                      />
                    ),
                    children: [{ path: "edit", element: <AttachmentEdit /> }]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.PEOPLE,
        children: [
          { path: "new", element: <PersonNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <PersonShow /> },
              { path: "compact", element: <PersonCompact /> },
              { path: "edit", element: <PersonEdit /> }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.ORGANIZATIONS,
        children: [
          { path: "new", element: <OrganizationNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <OrganizationShow /> },
              { path: ":action", element: <OrganizationShow /> },
              { path: "edit", element: <OrganizationEdit /> }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.LOCATIONS,
        children: [
          { path: "new", element: <LocationNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <LocationShow /> },
              { path: "edit", element: <LocationEdit /> }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.POSITIONS,
        children: [
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser =>
                  currentUser?.position?.uuid
                }
              />
            ),
            children: [{ path: "counterparts", element: <MyCounterparts /> }]
          },
          { path: "new", element: <PositionNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <PositionShow /> },
              { path: "edit", element: <PositionEdit /> }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.TASKS,
        children: [
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser =>
                  currentUser?.position?.uuid
                }
              />
            ),
            children: [{ path: "mine", element: <MyTasks /> }]
          },
          { path: "new", element: <TaskNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <TaskShow /> },
              { path: "edit", element: <TaskEdit /> }
            ]
          }
        ]
      },
      {
        path: "communities",
        children: [
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser => currentUser?.isAdmin()}
              />
            ),
            children: [{ path: "new", element: <AuthorizationGroupNew /> }]
          },
          {
            path: ":uuid",
            children: [
              { index: true, element: <AuthorizationGroupShow /> },
              { path: "edit", element: <AuthorizationGroupEdit /> }
            ]
          },
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser =>
                  !_isEmpty(
                    currentUser?.position?.authorizationGroupsAdministrated
                  )
                }
              />
            ),
            children: [{ path: "mine", element: <MyAuthorizationGroups /> }]
          }
        ]
      },
      {
        element: (
          <ProtectedRoute
            authorizationCallback={currentUser => currentUser?.isAdmin()}
          />
        ),
        children: [
          {
            path: PAGE_URLS.ADMIN,
            children: [
              { index: true, element: <AdminIndex /> },
              {
                element: (
                  <ProtectedRoute
                    authorizationCallback={() =>
                      !Settings.automaticallyAllowAllNewUsers
                    }
                  />
                ),
                children: [
                  {
                    path: "usersPendingVerification",
                    element: <UsersPendingVerification />
                  }
                ]
              },
              {
                path: "merge",
                children: [
                  { path: "people", element: <MergePeople /> },
                  { path: "positions", element: <MergePositions /> },
                  { path: "locations", element: <MergeLocations /> },
                  { path: "organizations", element: <MergeOrganizations /> },
                  { path: "tasks", element: <MergeTasks /> }
                ]
              },
              {
                path: "userActivities",
                children: [
                  { path: "perPeriod", element: <UserActivitiesPerPeriod /> },
                  { path: "overTime", element: <UserActivitiesOverTime /> }
                ]
              },
              { path: "auditTrail", element: <AuditTrailTable /> },
              { path: "pendingEmails", element: <PendingEmailsShow /> },
              { path: "accessTokens", element: <AccessTokensList /> },
              {
                path: "configureEventTypes",
                element: <ConfigureEventTypesShow />
              },
              {
                element: (
                  <ProtectedRoute
                    authorizationCallback={() => Settings.featureMartGuiEnabled}
                  />
                ),
                children: [
                  { path: "martImporter", element: <MartImporterShow /> }
                ]
              },
              { path: "graphiql", element: <GraphiQL /> },
              { path: "preferences", element: <Preferences /> }
            ]
          }
        ]
      },
      { path: PAGE_URLS.TOP_TASKS, element: <TopTasks /> },
      { path: PAGE_URLS.EVENTS, element: <EventsList /> },
      {
        path: PAGE_URLS.INSIGHTS,
        children: [{ path: ":insight", element: <InsightsShow /> }]
      },
      {
        path: PAGE_URLS.DASHBOARDS,
        children: [
          {
            path: "kanban",
            children: [{ path: ":dashboard", element: <KanbanDashboard /> }]
          },
          {
            path: "decisives",
            children: [{ path: ":dashboard", element: <DecisivesDashboard /> }]
          }
        ]
      },
      {
        path: PAGE_URLS.ONBOARDING,
        children: [
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser =>
                  currentUser?.isPendingVerification()
                }
              />
            ),
            children: [
              { index: true, path: "new", element: <OnboardingNew /> },
              { path: "edit", element: <OnboardingEdit /> },
              { path: "show", element: <OnboardingShow /> }
            ]
          },
          {
            element: (
              <ProtectedRoute
                authorizationCallback={currentUser =>
                  !currentUser?.isPendingVerification()
                }
              />
            ),
            children: [
              // Replace with home if user account exists already.
              // Some users bookmark the onboarding - the very first page they hit.
              {
                index: true,
                path: "*",
                element: <Navigate replace to={PAGE_URLS.HOME} />
              }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.SUBSCRIPTIONS,
        children: [{ path: "mine", element: <MySubscriptions /> }]
      },
      {
        path: PAGE_URLS.EVENT_SERIES,
        children: [
          { path: "new", element: <EventSeriesNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <EventSeriesShow /> },
              { path: "edit", element: <EventSeriesEdit /> }
            ]
          }
        ]
      },
      {
        path: PAGE_URLS.EVENTS,
        children: [
          { path: "mine", element: <MyEvents /> },
          { path: "new", element: <EventNew /> },
          {
            path: ":uuid",
            children: [
              { index: true, element: <EventShow /> },
              { path: "edit", element: <EventEdit /> }
            ]
          }
        ]
      },
      { path: PAGE_URLS.PREFERENCES, element: <MyPreferences /> },
      { path: PAGE_URLS.MISSING, element: <PageMissing /> }
    ]
  }
]

export default routes
