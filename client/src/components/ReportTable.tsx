import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Report } from "models"
import moment from "moment"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        primaryAdvisor {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        primaryInterlocutor {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        advisorOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        interlocutorOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
          lat
          lng
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        tasks {
          uuid
          shortName
        }
        updatedAt
        attachments {
          uuid
        }
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

interface ReportTableProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  showStatus?: boolean
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const ReportTable = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  showStatus,
  paginationKey,
  pagination,
  setPagination
}: ReportTableProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination?.(paginationKey, 0)
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

  const paginatedReports = data ? data.reportList : []
  const { pageSize, pageNum: curPage, list: reports } = paginatedReports
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageSize={setPagination && pageSize}
        pageNum={setPagination && curPage}
        totalCount={setPagination && totalCount}
        goToPage={setPagination && setPage}
      >
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Authors</th>
              <th>{Settings.fields.advisor.org.name}</th>
              <th>{Settings.fields.report.intent?.label}</th>
              {showStatus && <th>State</th>}
              <th>{Settings.fields.report.engagementDate?.label}</th>
              <th title="Does the report have attachments?">
                <Icon icon={IconNames.PAPERCLIP} />
              </th>
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
                <td
                  title={`The report has ${report.attachments.length} attachment(s)`}
                >
                  {report.attachments.length > 0 && (
                    <Icon icon={IconNames.PAPERCLIP} />
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

export default ReportTable
