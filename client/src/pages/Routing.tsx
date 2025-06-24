import AppContext from "components/AppContext"
import _isEmpty from "lodash/isEmpty"
import AccessTokensList from "pages/admin/accessTokens/Index"
import AdminIndex from "pages/admin/Index"
import MartImporterShow from "pages/admin/martImporter/Show"
import MergeLocations from "pages/admin/merge/MergeLocations"
import MergeOrganizations from "pages/admin/merge/MergeOrganizations"
import MergePeople from "pages/admin/merge/MergePeople"
import MergePositions from "pages/admin/merge/MergePositions"
import PendingEmailsShow from "pages/admin/pendingEmails/Show"
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
import React, { useContext } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import Settings from "settings"

const Routing = () => {
  const { currentUser } = useContext(AppContext)
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
  return (
    <Routes>
      <Route index path={PAGE_URLS.HOME} element={<Home />} />
      <Route path={PAGE_URLS.ROLLUP} element={<RollupShow />} />
      <Route path={PAGE_URLS.HELP} element={<Help />} />
      <Route path={PAGE_URLS.SEARCH}>
        <Route index element={<Search />} />
        <Route path="mine" element={<MySavedSearches />} />
      </Route>
      <Route path={PAGE_URLS.REPORTS}>
        <Route path="mine" element={<MyReports />} />
        <Route path="new" element={<ReportNew />} />
        <Route path=":uuid">
          <Route index element={<ReportShow />} />
          <Route path="compact" element={<ReportCompact />} />
          <Route path="edit" element={<ReportEdit />} />
          {/* TODO: Backwards-compatibility; this route can be removed at some point */}
          <Route path="min" element={<ReportShow />} />
        </Route>
      </Route>
      {attachmentsEnabled && (
        <Route path={PAGE_URLS.ATTACHMENTS}>
          <Route path="mine" element={<MyAttachments />} />
          <Route path=":uuid">
            <Route index element={<AttachmentShow />} />
            {attachmentEditEnabled && (
              <Route path="edit" element={<AttachmentEdit />} />
            )}
          </Route>
        </Route>
      )}
      <Route path={PAGE_URLS.PEOPLE}>
        <Route path="new" element={<PersonNew />} />
        <Route path=":uuid">
          <Route index element={<PersonShow />} />
          <Route path="compact" element={<PersonCompact />} />
          <Route path="edit" element={<PersonEdit />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.ORGANIZATIONS}>
        <Route path="new" element={<OrganizationNew />} />
        <Route path=":uuid">
          <Route index element={<OrganizationShow />} />
          <Route path=":action" element={<OrganizationShow />} />
          <Route path="edit" element={<OrganizationEdit />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.LOCATIONS}>
        <Route path="new" element={<LocationNew />} />
        <Route path=":uuid">
          <Route index element={<LocationShow />} />
          <Route path="edit" element={<LocationEdit />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.POSITIONS}>
        {currentUser.position?.uuid && (
          <Route path="counterparts" element={<MyCounterparts />} />
        )}
        <Route path="new" element={<PositionNew />} />
        <Route path=":uuid">
          <Route index element={<PositionShow />} />
          <Route path="edit" element={<PositionEdit />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.TASKS}>
        {currentUser.position?.uuid && (
          <Route path="mine" element={<MyTasks />} />
        )}
        <Route path="new" element={<TaskNew />} />
        <Route path=":uuid">
          <Route index element={<TaskShow />} />
          <Route path="edit" element={<TaskEdit />} />
        </Route>
      </Route>
      <Route path="communities">
        {currentUser.isAdmin() && (
          <Route path="new" element={<AuthorizationGroupNew />} />
        )}
        <Route path=":uuid">
          <Route index element={<AuthorizationGroupShow />} />
          <Route path="edit" element={<AuthorizationGroupEdit />} />
        </Route>
        {!_isEmpty(currentUser?.position?.authorizationGroupsAdministrated) && (
          <Route path="mine" element={<MyAuthorizationGroups />} />
        )}
      </Route>
      {currentUser.isAdmin() && (
        <Route path={PAGE_URLS.ADMIN}>
          <Route index element={<AdminIndex />} />
          {!Settings.automaticallyAllowAllNewUsers && (
            <Route
              path="usersPendingVerification"
              element={<UsersPendingVerification />}
            />
          )}
          <Route path="merge">
            <Route path="people" element={<MergePeople />} />
            <Route path="positions" element={<MergePositions />} />
            <Route path="locations" element={<MergeLocations />} />
            <Route path="organizations" element={<MergeOrganizations />} />
          </Route>
          <Route path="userActivities">
            <Route path="perPeriod" element={<UserActivitiesPerPeriod />} />
            <Route path="overTime" element={<UserActivitiesOverTime />} />
          </Route>
          <Route path="pendingEmails" element={<PendingEmailsShow />} />
          <Route path="accessTokens" element={<AccessTokensList />} />
          {Settings.featureMartGuiEnabled && (
            <Route path="martImporter" element={<MartImporterShow />} />
          )}
          <Route path="graphiql" element={<GraphiQL />} />
        </Route>
      )}
      <Route path={PAGE_URLS.TOP_TASKS} element={<TopTasks />} />
      <Route path={PAGE_URLS.INSIGHTS}>
        <Route path=":insight" element={<InsightsShow />} />
      </Route>
      <Route path={PAGE_URLS.DASHBOARDS}>
        <Route path="kanban">
          <Route path=":dashboard" element={<KanbanDashboard />} />
        </Route>
        <Route path="decisives">
          <Route path=":dashboard" element={<DecisivesDashboard />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.ONBOARDING}>
        {currentUser.isPendingVerification() ? (
          <>
            <Route index path="new" element={<OnboardingNew />} />
            <Route path="edit" element={<OnboardingEdit />} />
            <Route path="show" element={<OnboardingShow />} />
          </>
        ) : (
          // Replace with home if user account exists already.
          // Some users bookmark the onboarding - the very first page they hit.
          <Route
            index
            path="*"
            element={<Navigate replace to={PAGE_URLS.HOME} />}
          />
        )}
      </Route>
      <Route path={PAGE_URLS.SUBSCRIPTIONS}>
        <Route path="mine" element={<MySubscriptions />} />
      </Route>
      <Route path={PAGE_URLS.MISSING} element={<PageMissing />} />
      <Route path={PAGE_URLS.EVENT_SERIES}>
        <Route path="new" element={<EventSeriesNew />} />
        <Route path=":uuid">
          <Route index element={<EventSeriesShow />} />
          <Route path="edit" element={<EventSeriesEdit />} />
        </Route>
      </Route>
      <Route path={PAGE_URLS.EVENTS}>
        <Route path="mine" element={<MyEvents />} />
        <Route path="new" element={<EventNew />} />
        <Route path=":uuid">
          <Route index element={<EventShow />} />
          <Route path="edit" element={<EventEdit />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default Routing
