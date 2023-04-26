import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
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
        authors {
          uuid
          name
          rank
          avatarUuid
        }
        primaryAdvisor {
          uuid
          name
          rank
          avatarUuid
        }
        primaryInterlocutor {
          uuid
          name
          rank
          avatarUuid
        }
        advisorOrg {
          uuid
          shortName
          longName
          identificationCode
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
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
        updatedAt
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

const ReportTable = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  showStatus,
  paginationKey,
  pagination,
  setPagination
}) => {
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
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }

  const reports = data ? Report.fromArray(data.reportList.list) : []
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  const { pageSize } = data.reportList

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Authors</th>
              <th>Organization</th>
              <th>Summary</th>
              {showStatus && <th>Status</th>}
              <th>Engagement Date</th>
            </tr>
          </thead>

          <tbody>
            {reports.map(report => (
              <tr key={report.uuid}>
                <td>
                  {report.authors?.map(a => (
                    <React.Fragment key={a.uuid}>
                      <LinkTo modelType="Person" model={a} />
                      <br />
                    </React.Fragment>
                  ))}
                </td>
                <td>
                  <LinkTo modelType="Organization" model={report.advisorOrg} />
                </td>
                <td>
                  <LinkTo
                    modelType="Report"
                    model={report}
                    className="read-report-button"
                  />
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
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  showStatus: PropTypes.bool,
  paginationKey: PropTypes.string.isRequired,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired
}

export default ReportTable
