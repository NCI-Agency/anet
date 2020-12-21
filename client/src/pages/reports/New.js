import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import { getInvisibleFields } from "components/CustomFields"
import GuidedTour from "components/GuidedTour"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  INVISIBLE_CUSTOM_FIELDS_FIELD
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
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

  const report = new Report()

  if (report[DEFAULT_CUSTOM_FIELDS_PARENT]) {
    // set initial invisible custom fields
    report[DEFAULT_CUSTOM_FIELDS_PARENT][
      INVISIBLE_CUSTOM_FIELDS_FIELD
    ] = getInvisibleFields(
      Settings.fields.report.customFields,
      DEFAULT_CUSTOM_FIELDS_PARENT,
      report
    )
  }

  if (currentUser && currentUser.uuid) {
    const person = new Person(currentUser)
    person.primary = true
    person.author = true
    person.attendee = true
    report.reportPeople.push(person)
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
