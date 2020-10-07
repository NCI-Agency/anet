import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import GuidedTour from "components/GuidedTour"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Person, Report } from "models"
import { reportTour } from "pages/HopscotchTour"
import React, { useContext } from "react"
import { connect } from "react-redux"
import ReportForm from "./Form"

const ReportNew = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const report = new Report()
  if (currentUser && currentUser.uuid) {
    const person = new Person(currentUser)
    person.primary = true
    person.author = true
    report.attendees.push(person)
  }
  const reportInitialValues = Object.assign(
    report,
    report.getTasksEngagementAssessments(),
    report.getAttendeesEngagementAssessments()
  )

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

ReportNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(ReportNew)
