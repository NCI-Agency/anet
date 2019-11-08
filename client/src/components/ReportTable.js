import API from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
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
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const reportQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
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
    if (setTotalCount) {
      // Reset the total count
      setTotalCount(null)
    }
    return result
  }

  const reports = data ? Report.fromArray(data.reportList.list) : []
  if (setTotalCount) {
    const totalCount = data && data.reportList && data.reportList.totalCount
    setTotalCount(totalCount)
  }
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  const { pageSize, totalCount } = data.reportList

  return (
    <div>
      <UltimatePaginationTopDown
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
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
                <td>
                  <LinkTo organization={report.advisorOrg} />
                </td>
                <td>
                  <LinkTo report={report} className="read-report-button" />
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
      </UltimatePaginationTopDown>
    </div>
  )

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
