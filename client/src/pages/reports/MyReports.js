import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import { AnchorNavItem } from "components/Nav"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import ReportCollection from "components/ReportCollection"
import SubNav from "components/SubNav"
import GQL from "graphqlapi"
import { Person, Report } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Nav } from "react-bootstrap"
import { connect } from "react-redux"

class BaseMyReports extends Page {
  static propTypes = {
    ...pagePropTypes,
    pagination: PropTypes.object,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)

    this.state = {
      draft: null,
      future: null,
      pending: null,
      approved: null,
      published: null,
      cancelled: null
    }
    this.partFuncs = {
      draft: this.getPart.bind(this, "draft", [
        Report.STATE.DRAFT,
        Report.STATE.REJECTED
      ]),
      future: this.getPart.bind(this, "future", [Report.STATE.FUTURE]),
      pending: this.getPart.bind(this, "pending", [
        Report.STATE.PENDING_APPROVAL
      ]),
      approved: this.getPart.bind(this, "approved", [Report.STATE.APPROVED]),
      published: this.getPart.bind(this, "published", [Report.STATE.PUBLISHED]),
      cancelled: this.getPart.bind(this, "cancelled", [Report.STATE.CANCELLED])
    }
  }

  @autobind
  getPart(partName, state, authorUuid, pageNum = 0) {
    const queryConstPart = {
      pageSize: 10,
      pageNum: pageNum,
      authorUuid: authorUuid,
      state: state
    }
    const query = Object.assign({}, this.getSearchQuery(), queryConstPart)
    return new GQL.Part(/* GraphQL */ `
      ${partName}: reportList(query: $${partName}Query) {
        pageNum, pageSize, totalCount, list {
          ${ReportCollection.GQL_REPORT_FIELDS}
        }
      }`).addVariable(partName + "Query", "ReportSearchQueryInput", query)
  }

  _approvalStepParts = props => {
    const { currentUser, pagination } = props
    const authorUuid = currentUser.uuid
    return Object.keys(this.partFuncs).map(part => {
      const goToPageNum = this.getPaginatedNum(pagination[part])
      return this.partFuncs[part](authorUuid, goToPageNum)
    })
  }

  fetchData(props) {
    const { currentUser } = props
    if (!currentUser || !currentUser.uuid) {
      return
    }
    const parts = this._approvalStepParts(props)
    return GQL.run(parts).then(approvalSteps =>
      this.setState({ ...approvalSteps })
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

        {this.renderSection(
          "Draft Reports",
          this.state.draft,
          this.goToPage.bind(this, "draft"),
          "draft-reports",
          "draft"
        )}
        {this.renderSection(
          "Upcoming Engagements",
          this.state.future,
          this.goToPage.bind(this, "future"),
          "upcoming-engagements",
          "future"
        )}
        {this.renderSection(
          "Pending Approval",
          this.state.pending,
          this.goToPage.bind(this, "pending"),
          "pending-approval",
          "pending"
        )}
        {this.renderSection(
          "Approved",
          this.state.approved,
          this.goToPage.bind(this, "approved"),
          "approved",
          "approved"
        )}
        {this.renderSection(
          "Published Reports",
          this.state.published,
          this.goToPage.bind(this, "published"),
          "published-reports",
          "published"
        )}
        {this.renderSection(
          "Cancelled Reports",
          this.state.cancelled,
          this.goToPage.bind(this, "cancelled"),
          "cancelled-reports",
          "cancelled"
        )}
      </div>
    )
  }

  getPaginatedNum = (part, pageNum = 0) => {
    let goToPageNum = pageNum
    if (part !== undefined) {
      goToPageNum = part.pageNum
    }
    return goToPageNum
  }

  renderSection = (title, reports, goToPage, id, section) => {
    const paginatedPart = this.props.pagination[section]
    const goToPageNum = this.getPaginatedNum(paginatedPart)
    let content = <p>Loading...</p>
    if (reports && reports.list) {
      const paginatedReports = Object.assign(reports, { pageNum: goToPageNum })
      content = (
        <ReportCollection
          paginatedReports={paginatedReports}
          goToPage={goToPage}
          mapId={id}
        />
      )
    }

    return (
      <Fieldset title={title} id={id}>
        {content}
      </Fieldset>
    )
  }

  @autobind
  goToPage(section, pageNum) {
    const { currentUser, setPagination } = this.props
    const part = this.partFuncs[section](currentUser.uuid, pageNum)
    GQL.run([part]).then(data => {
      let stateChange = {}
      stateChange[section] = data[section]
      this.setState(stateChange, () => setPagination(section, pageNum))
    })
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery,
  pagination: state.pagination
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
