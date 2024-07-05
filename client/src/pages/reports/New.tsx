import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import { initInvisibleFields } from "components/CustomFields"
import GuidedTour from "components/GuidedTour"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Event, Person, Report, Task } from "models"
import { reportTour } from "pages/GuidedTour"
import React, { useContext } from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import ReportForm from "./Form"

interface ReportNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const ReportNew = ({ pageDispatchers }: ReportNewProps) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Report")

  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.get("eventUuid")) {
    return (
      <ReportNewFetchEvent
        eventUuid={qs.get("eventUuid")}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <ReportNewConditional pageDispatchers={pageDispatchers} />
}

interface ReportNewFetchEventProps {
  eventUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const ReportNewFetchEvent = ({
  eventUuid,
  pageDispatchers
}: ReportNewFetchEventProps) => {
  const queryResult = API.useApiQuery(Event.getEventQueryNoIsSubscribed, {
    uuid: eventUuid
  })
  return (
    <ReportNewConditional
      pageDispatchers={pageDispatchers}
      {...queryResult}
      eventUuid={eventUuid}
    />
  )
}

interface ReportNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  eventUuid?: string
  pageDispatchers?: PageDispatchersPropType
}

const ReportNewConditional = ({
  loading,
  error,
  data,
  eventUuid,
  pageDispatchers
}: ReportNewConditionalProps) => {
  const { currentUser } = useContext(AppContext)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "EventSeries",
    uuid: eventUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const report = new Report()
  if (data) {
    const event = new Event(data.event)
    const tasks = []
    event.tasks.forEach(task => tasks.push(new Task(task)))
    report.event = Event.filterClientSideFields(event)
    report.location = event.location
    report.tasks = tasks
  }
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

export default connect(null, mapPageDispatchersToProps)(ReportNew)
