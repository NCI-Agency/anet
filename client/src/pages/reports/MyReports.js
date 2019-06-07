import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import { AnchorNavItem } from "components/Nav"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import ReportCollectionContainer from "components/ReportCollectionContainer"
import SubNav from "components/SubNav"
import { Person, Report } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Nav } from "react-bootstrap"
import { connect } from "react-redux"

class BaseMyReports extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)
    this.sectionQueryParams = {
      draft: {
        state: [Report.STATE.DRAFT, Report.STATE.REJECTED]
      },
      future: {
        state: [Report.STATE.FUTURE]
      },
      pending: {
        state: [Report.STATE.PENDING_APPROVAL]
      },
      approved: {
        state: [Report.STATE.APPROVED]
      },
      published: {
        state: [Report.STATE.PUBLISHED]
      },
      cancelled: {
        state: [Report.STATE.CANCELLED]
      }
    }
    Object.keys(this.sectionQueryParams).forEach(
      key =>
        (this.sectionQueryParams[key].authorUuid = props.currentUser.uuid)
    )
  }

  render() {
    return (
      <div>
        <SubNav subnavElemId="reports-nav">
          <Nav>
            <AnchorNavItem to="draft-reports">Draft reports</AnchorNavItem>
            <AnchorNavItem to="upcoming-engagements">
              Upcoming Engagements
            </AnchorNavItem>
            <AnchorNavItem to="pending-approval">
              Pending approval
            </AnchorNavItem>
            <AnchorNavItem to="approved">Approved reports</AnchorNavItem>
            <AnchorNavItem to="published-reports">
              Published reports
            </AnchorNavItem>
            <AnchorNavItem to="cancelled-reports">
              Cancelled reports
            </AnchorNavItem>
          </Nav>
        </SubNav>

        {this.renderSection("Draft Reports", "draft-reports", "draft")}
        {this.renderSection(
          "Upcoming Engagements",
          "upcoming-engagements",
          "future"
        )}
        {this.renderSection("Pending Approval", "pending-approval", "pending")}
        {this.renderSection("Approved", "approved", "approved")}
        {this.renderSection(
          "Published Reports",
          "published-reports",
          "published"
        )}
        {this.renderSection(
          "Cancelled Reports",
          "cancelled-reports",
          "cancelled"
        )}
      </div>
    )
  }
  renderSection = (title, id, section) => {
    const queryParams = Object.assign(
      {},
      this.sectionQueryParams[section],
      this.getSearchQuery()
    )
    return (
      <Fieldset title={title} id={id}>
        <ReportCollectionContainer queryParams={queryParams} mapId={id} />
      </Fieldset>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const MyReports = props => (
  <AppContext.Consumer>
    {context => <BaseMyReports currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyReports)
