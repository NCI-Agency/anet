import API from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        engagementDate
        duration
        keyOutcomes
        nextSteps
        cancelledReason
        atmosphere
        atmosphereDetails
        state
        author {
          uuid
          name
          rank
          role
        }
        primaryAdvisor {
          uuid
          name
          rank
          role
        }
        primaryPrincipal {
          uuid
          name
          rank
          role
        }
        advisorOrg {
          uuid
          shortName
        }
        principalOrg {
          uuid
          shortName
        }
        location {
          uuid
          name
          lat
          lng
        }
        tasks {
          uuid
          shortName
        }
        tags {
          uuid
          name
          description
        }
        workflow {
          type
          createdAt
          step {
            uuid
            name
            approvers {
              uuid
              name
              person {
                uuid
                name
                rank
                role
              }
            }
          }
          person {
            uuid
            name
            rank
            role
          }
        }
        updatedAt
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

const ReportTable = props => {
  const {
    queryParams,
    setTotalCount,
    showAuthors,
    showStatus,
    paginationKey,
    pagination,
    setPagination
  } = props
  const [pageNum, setPageNum] = useState(
    pagination[paginationKey] ? pagination[paginationKey].pageNum : 0
  )
  const reportQuery = Object.assign({}, queryParams, {
    pageNum,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const reports = data ? Report.fromArray(data.reportList.list) : []
  if (setTotalCount) {
    const { totalCount } = data.reportList
    setTotalCount(totalCount)
  }
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  return (
    <>
      {renderPagination()}
      <Table striped>
        <thead>
          <tr>
            {showAuthors && <th>Author</th>}
            <th>Organization</th>
            <th>Summary</th>
            {showStatus && <th>Status</th>}
            <th>Engagement Date</th>
          </tr>
        </thead>

        <tbody>
          {reports.map(report => (
            <tr key={report.uuid}>
              {showAuthors && (
                <td>
                  <LinkTo person={report.author} />
                </td>
              )}
              <td>{<LinkTo organization={report.advisorOrg} />}</td>
              <td>
                {<LinkTo report={report} className="read-report-button" />}
              </td>
              {showStatus && <td>{report.state}</td>}
              <td>
                {moment(report.engagementDate).format(
                  Report.getEngagementDateFormat()
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  )

  function renderPagination() {
    let { pageSize, pageNum, totalCount } = data.reportList
    let numPages = Math.ceil(totalCount / pageSize)
    if (numPages < 2) {
      return
    }
    return (
      <header>
        <UltimatePagination
          className="pull-right"
          currentPage={pageNum + 1}
          totalPages={numPages}
          boundaryPagesRange={1}
          siblingPagesRange={2}
          hideEllipsis={false}
          hidePreviousAndNextPageLinks={false}
          hideFirstAndLastPageLinks
          onChange={value => setPage(value - 1)}
        />
      </header>
    )
  }

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

ReportTable.propTypes = {
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  showAuthors: PropTypes.bool,
  showStatus: PropTypes.bool,
  paginationKey: PropTypes.string.isRequired,
  setPagination: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReportTable)
