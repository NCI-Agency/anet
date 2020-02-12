import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import GuidedTour from "components/GuidedTour"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Person, Report } from "models"
import { reportTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import ReportForm from "./Form"

const BaseReportNew = ({ pageDispatchers, currentUser }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const report = new Report()
  if (currentUser && currentUser.uuid) {
    const person = new Person(currentUser)
    person.primary = true
    report.attendees.push(person)
  }
  const reportInitialValues = Object.assign(report, report.getTaskAssessments())

  return (
    <div className="report-new">
      <div className="pull-right">
        <GuidedTour
          title="Take a guided tour of the report page."
          tour={reportTour}
          autostart={
            localStorage.newUser === "true" &&
            localStorage.hasSeenReportTour !== "true"
          }
          onEnd={() => (localStorage.hasSeenReportTour = "true")}
        />
      </div>

      <ReportForm
        initialValues={reportInitialValues}
        title="Create a new Report"
      />
    </div>
  )
}

BaseReportNew.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  currentUser: PropTypes.instanceOf(Person)
}

const ReportNew = props => (
  <AppContext.Consumer>
    {context => <BaseReportNew currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(ReportNew)
