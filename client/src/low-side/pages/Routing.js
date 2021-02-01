import Help from "low-side/pages/Help"
import Home from "low-side/pages/Home"
import EditReport from "low-side/pages/report/Edit"
import NewReport from "low-side/pages/report/New"
import ShowReport from "low-side/pages/report/Show"
import { PAGE_URLS } from "low-side/pages/utils"
import React from "react"
import { Route, Switch } from "react-router-dom"

const Routing = () => {
  return (
    <Switch>
      <Route exact path={PAGE_URLS.HOME} component={Home} />
      <Route
        path={PAGE_URLS.REPORTS}
        render={({ match: { url } }) => (
          <Switch>
            <Route path={`${url}/new`} component={NewReport} />
            <Route path={`${url}/:uuid/edit`} component={EditReport} />
            <Route path={`${url}/:uuid`} component={ShowReport} />
          </Switch>
        )}
      />
      <Route path={PAGE_URLS.MISSING} component={Help} />
    </Switch>
  )
}

export default Routing
