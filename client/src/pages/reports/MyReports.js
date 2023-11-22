import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import { AnchorNavItem } from "components/Nav"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import ReportCollection from "components/ReportCollection"
import { getSearchQuery, SearchQueryPropType } from "components/SearchFilters"
import SubNav from "components/SubNav"
import { Report } from "models"
import React, { useContext } from "react"
import { Nav } from "react-bootstrap"
import { connect } from "react-redux"

const MyReports = ({ pageDispatchers, searchQuery }) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  usePageTitle("My Reports")
  const {
    currentUser: { uuid }
  } = useContext(AppContext)
  const sectionQueryParams = {
    draft: {
      state: [Report.STATE.DRAFT, Report.STATE.REJECTED]
    },
    future: {
      engagementStatus: "FUTURE"
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
  Object.values(sectionQueryParams).forEach(val => (val.authorUuid = uuid))

  return (
    <div>
      <SubNav subnavElemId="reports-nav">
        <span id="style-nav">
          <Nav className="flex-column">
            <Nav.Item>
              <AnchorNavItem to="draft-reports">Draft reports</AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="planned-engagements">
                Planned Engagements
              </AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="pending-approval">
                Pending approval
              </AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="approved">Approved reports</AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="published-reports">
                Published reports
              </AnchorNavItem>
            </Nav.Item>
            <Nav.Item>
              <AnchorNavItem to="cancelled-reports">
                Cancelled reports
              </AnchorNavItem>
            </Nav.Item>
          </Nav>
        </span>
      </SubNav>

      {renderSection("Draft Reports", "draft-reports", "draft")}
      {renderSection("Planned Engagements", "planned-engagements", "future")}
      {renderSection("Pending Approval", "pending-approval", "pending")}
      {renderSection("Approved", "approved", "approved")}
      {renderSection("Published Reports", "published-reports", "published")}
      {renderSection("Cancelled Reports", "cancelled-reports", "cancelled")}
    </div>
  )

  function renderSection(title, id, section) {
    const queryParams = Object.assign(
      {},
      sectionQueryParams[section],
      getSearchQuery(searchQuery)
    )
    return (
      <Fieldset title={title} id={id}>
        <ReportCollection
          paginationKey={`r_${id}_${uuid}`}
          queryParams={queryParams}
          mapId={id}
        />
      </Fieldset>
    )
  }
}

MyReports.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  searchQuery: SearchQueryPropType
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(MyReports)
