import { DEFAULT_PAGE_PROPS } from "actions"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import { AnchorNavItem } from "components/Nav"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_STATISTICS,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
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
        <Nav>
          <AnchorNavItem to="draft-reports">Draft reports</AnchorNavItem>
          <AnchorNavItem to="planned-engagements">
            Planned Engagements
          </AnchorNavItem>
          <AnchorNavItem to="pending-approval">Pending approval</AnchorNavItem>
          <AnchorNavItem to="approved">Approved reports</AnchorNavItem>
          <AnchorNavItem to="published-reports">
            Published reports
          </AnchorNavItem>
          <AnchorNavItem to="cancelled-reports">
            Cancelled reports
          </AnchorNavItem>
        </Nav>
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
          viewFormats={[
            FORMAT_SUMMARY,
            FORMAT_TABLE,
            FORMAT_CALENDAR,
            FORMAT_MAP,
            FORMAT_STATISTICS
          ]}
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
