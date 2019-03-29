import { PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import GuidedTour from "components/GuidedTour"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Person, Report } from "models"
import { reportTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import ReportForm from "./Form"

class BaseReportNew extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  state = {
    report: new Report()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  componentDidUpdate() {
    this.addCurrentUserAsAttendee()
  }

  componentDidMount() {
    this.addCurrentUserAsAttendee()
  }

  addCurrentUserAsAttendee = () => {
    const { currentUser } = this.props
    if (this.state.report.addAttendee(currentUser)) {
      this.forceUpdate()
    }
  }

  render() {
    const { report } = this.state
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

        <ReportForm initialValues={report} title="Create a new Report" />
      </div>
    )
  }
}

const ReportNew = props => (
  <AppContext.Consumer>
    {context => <BaseReportNew currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(ReportNew)
