import AppContext from "components/AppContext"
import { Person } from "models"
import AuthorizationGroupEdit from "pages/admin/authorizationgroup/Edit"
import AuthorizationGroupNew from "pages/admin/authorizationgroup/New"
import AuthorizationGroupShow from "pages/admin/authorizationgroup/Show"
import AuthorizationGroups from "pages/admin/AuthorizationGroups"
import AdminIndex from "pages/admin/Index"
import MergePeople from "pages/admin/MergePeople"
import DecisivesDashboard from "pages/dashboards/DecisivesDashboard"
import KanbanDashboard from "pages/dashboards/KanbanDashboard"
import GraphiQL from "pages/GraphiQL"
import Help from "pages/Help"
import Home from "pages/Home"
import InsightsShow from "pages/insights/Show"
import LocationEdit from "pages/locations/Edit"
import LocationNew from "pages/locations/New"
import LocationShow from "pages/locations/Show"
import OnboardingEdit from "pages/onboarding/Edit"
import OnboardingShow from "pages/onboarding/Show"
import OrganizationEdit from "pages/organizations/Edit"
import OrganizationNew from "pages/organizations/New"
import OrganizationShow from "pages/organizations/Show"
import PageMissing from "pages/PageMissing"
import PersonEdit from "pages/people/Edit"
import PersonNew from "pages/people/New"
import PersonShow from "pages/people/Show"
import PositionEdit from "pages/positions/Edit"
import PositionNew from "pages/positions/New"
import PositionShow from "pages/positions/Show"
import ReportEdit from "pages/reports/Edit"
import ReportMinimal from "pages/reports/Minimal"
import MyReports from "pages/reports/MyReports"
import ReportNew from "pages/reports/New"
import ReportShow from "pages/reports/Show"
import RollupShow from "pages/rollup/Show"
import Search from "pages/Search"
import TaskEdit from "pages/tasks/Edit"
import TaskNew from "pages/tasks/New"
import TaskShow from "pages/tasks/Show"
import { PAGE_URLS } from "pages/util"
import PropTypes from "prop-types"
import React from "react"
import { Redirect, Route, Switch } from "react-router-dom"

const BaseRouting = ({ currentUser }) => (
  <Switch>
    <Route exact path={PAGE_URLS.HOME} component={Home} />
    <Route path={PAGE_URLS.SEARCH} component={Search} />
    <Route path={PAGE_URLS.ROLLUP} component={RollupShow} />
    <Route path={PAGE_URLS.GRAPHIQL} component={GraphiQL} />
    <Route path={PAGE_URLS.HELP} component={Help} />
    <Route
      path={PAGE_URLS.REPORTS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={ReportNew} />
          <Route path={`${url}/:uuid/edit`} component={ReportEdit} />
          <Route path={`${url}/:uuid/min`} component={ReportMinimal} />
          <Route path={`${url}/mine`} component={MyReports} />
          <Route path={`${url}/:uuid`} component={ReportShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.PEOPLE}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={PersonNew} />
          <Route path={`${url}/:uuid/edit`} component={PersonEdit} />
          <Route path={`${url}/:uuid`} component={PersonShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.ORGANIZATIONS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={OrganizationNew} />
          <Route path={`${url}/:uuid/edit`} component={OrganizationEdit} />
          <Route path={`${url}/:uuid/:action?`} component={OrganizationShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.LOCATIONS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={LocationNew} />
          <Route path={`${url}/:uuid/edit`} component={LocationEdit} />
          <Route path={`${url}/:uuid`} component={LocationShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.POSITIONS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={PositionNew} />
          <Route path={`${url}/:uuid/edit`} component={PositionEdit} />
          <Route path={`${url}/:uuid`} component={PositionShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.TASKS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/new`} component={TaskNew} />
          <Route path={`${url}/:uuid/edit`} component={TaskEdit} />
          <Route path={`${url}/:uuid`} component={TaskShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.ADMIN}
      render={({ match: { url } }) => (
        <Switch>
          <Route exact path={`${url}/`} component={AdminIndex} />
          <Route path={`${url}/mergePeople`} component={MergePeople} />
          <Route
            exact
            path={`${url}/authorizationGroups`}
            component={AuthorizationGroups}
          />
          <Route
            path={`${url}/authorizationGroups/new`}
            component={AuthorizationGroupNew}
          />
          <Route
            path={`${url}/authorizationGroups/:uuid/edit`}
            component={AuthorizationGroupEdit}
          />
          <Route
            path={`${url}/authorizationGroups/:uuid`}
            component={AuthorizationGroupShow}
          />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.INSIGHTS}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/:insight`} component={InsightsShow} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.KANBAN}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/:dashboard`} component={KanbanDashboard} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.DECISIVES}
      render={({ match: { url } }) => (
        <Switch>
          <Route path={`${url}/:dashboard`} component={DecisivesDashboard} />
        </Switch>
      )}
    />
    <Route
      path={PAGE_URLS.ONBOARDING}
      render={({ match: { url } }) =>
        currentUser.isNewUser() ? (
          <Switch>
            <Route exact path={`${url}/`} component={OnboardingShow} />
            <Route path={`${url}/edit`} component={OnboardingEdit} />
          </Switch>
        ) : (
          // Redirect to home if user account exists already. Some users bookmark the onboarding - the very first page they hit
          <Redirect to="/" />
        )}
    />
    <Route path={PAGE_URLS.MISSING} component={PageMissing} />
  </Switch>
)

BaseRouting.propTypes = {
  currentUser: PropTypes.instanceOf(Person)
}

const Routing = props => (
  <AppContext.Consumer>
    {context => <BaseRouting currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default Routing
