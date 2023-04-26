import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import { initInvisibleFields } from "components/CustomFields"
import GuidedTour from "components/GuidedTour"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Person, Report } from "models"
import { reportTour } from "pages/HopscotchTour"
import React, { useContext } from "react"
import { connect } from "react-redux"
import Settings from "settings"
import ReportForm from "./Form"

const ReportNew = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Report")

  const report = new Report()

  // mutates the object
  initInvisibleFields(report, Settings.fields.report.customFields)

  if (currentUser && currentUser.uuid) {
    const person = new Person(currentUser)
    person.primary = true
    person.author = true
    person.attendee = true
    person.interlocutor = false
    report.reportPeople.push(person)
  }
  const reportInitialValues = Object.assign(
    report,
    report.getTasksEngagementAssessments(),
    report.getAttendeesEngagementAssessments()
  )

  return (
    <div className="report-new">
      <div className="float-end">
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
