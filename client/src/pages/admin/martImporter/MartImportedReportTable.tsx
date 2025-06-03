import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_MART_REPORTS_IMPORTED = gql`
  query ($martImportedReportQuery: MartImportedReportSearchQueryInput) {
    martImportedReportList(query: $martImportedReportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        report {
          uuid
          intent
        }
        sequence
        state
        submittedAt
        receivedAt
        errors
      }
    }

    uniqueMartReportAuthors {
      uuid
      name
    }

    uniqueMartReportReports {
      uuid
      intent
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25
const FILTER_OPTIONS = [
  { value: "", label: "All states" },
  { value: "SUBMITTED_OK", label: "Submitted without warnings" },
  { value: "SUBMITTED_WARNINGS", label: "Submitted with warnings" },
  { value: "NOT_SUBMITTED", label: "Not submitted" },
  { value: "NOT_RECEIVED", label: "Not received" }
]

interface MartImportedReportTableProps {
  pageDispatchers?: PageDispatchersPropType
  selectedReportUuid?: string
  onSelectReport?: (...args: unknown[]) => unknown
}

const MartImportedReportTable = ({
  pageDispatchers,
  selectedReportUuid,
  onSelectReport
}: MartImportedReportTableProps) => {
  usePageTitle("MART reports imported")
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [sortBy, setSortBy] = useState("RECEIVED_AT")
  const [sortOrder, setSortOrder] = useState("DESC")
  const [selectedState, setSelectedState] = useState(undefined)
  const [filterByAuthorUuid, setFilterByAuthorUuid] = useState(undefined)
  const [filterByReportUuid, setFilterByReportUuid] = useState(undefined)

  const martImportedReportQuery = {
    pageNum,
    pageSize,
    state: selectedState,
    personUuid: filterByAuthorUuid,
    reportUuid: selectedReportUuid || filterByReportUuid,
    sortBy,
    sortOrder
  }

  const { loading, error, data } = API.useApiQuery(
    GQL_GET_MART_REPORTS_IMPORTED,
    {
      martImportedReportQuery
    }
  )

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  if (done) {
    return result
  }

  const authors = data.uniqueMartReportAuthors || []
  const reports = data.uniqueMartReportReports || []
  const { totalCount = 0, list: martImportedReports = [] } =
    data.martImportedReportList || {}

  const handlePageSizeChange = newPageSize => {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }

  const handleSortByChange = sortBy => {
    setSortBy(sortBy)
    setPageNum(0)
  }

  const handleSortOrderChange = sortOrder => {
    setSortOrder(sortOrder)
    setPageNum(0)
  }

  const handleStateFilterChange = state => {
    setSelectedState(state || null)
    setPageNum(0)
  }

  const handleAuthorChange = author => {
    setFilterByAuthorUuid(author || null)
    setPageNum(0)
  }

  const handleReportChange = report => {
    setFilterByReportUuid(report || null)
    setPageNum(0)
  }

  return (
    <>
      <Fieldset
        title="MART reports imported"
        action={
          <div className="flot-end d-flex align-items-center gap-3">
            <div>
              Filter by state:
              <FormSelect
                value={selectedState}
                onChange={e => handleStateFilterChange(e.target.value)}
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            {!selectedReportUuid && authors.length > 0 && (
              <div>
                Filter by author:
                <FormSelect
                  value={filterByAuthorUuid}
                  onChange={e => handleAuthorChange(e.target.value)}
                >
                  <option value="">All Authors</option>
                  {authors.map(author => (
                    <option key={author.uuid} value={author.uuid}>
                      {author.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}
            {!selectedReportUuid && reports.length > 0 && (
              <div>
                Filter by report:
                <FormSelect
                  value={filterByReportUuid}
                  onChange={e => handleReportChange(e.target.value)}
                >
                  <option value="">All Reports</option>
                  {reports.map(report => (
                    <option key={report.uuid} value={report.uuid}>
                      {report.intent}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}
            <div>
              Sort by:
              <FormSelect
                value={sortBy}
                onChange={e => handleSortByChange(e.target.value)}
              >
                <option value="SEQUENCE">Sequence</option>
                <option value="SUBMITTED_AT">Submitted At</option>
                <option value="RECEIVED_AT">Received At</option>
              </FormSelect>
            </div>
            <div>
              Order:
              <FormSelect
                value={sortOrder}
                onChange={e => handleSortOrderChange(e.target.value)}
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </FormSelect>
            </div>
            <div>
              Number per page:
              <FormSelect
                defaultValue={pageSize}
                onChange={e =>
                  handlePageSizeChange(
                    parseInt(e.target.value, 10) || DEFAULT_PAGESIZE
                  )}
              >
                {PAGESIZES.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        }
      >
        {_isEmpty(martImportedReports) ? (
          <em>No mart reports imported found</em>
        ) : (
          <UltimatePaginationTopDown
            componentClassName="searchPagination"
            className="float-end"
            pageNum={pageNum}
            pageSize={pageSize}
            totalCount={totalCount}
            goToPage={setPageNum}
          >
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Submitted Date</th>
                  <th>Received Date</th>
                  <th>Received</th>
                  <th>Submitted</th>
                  {!selectedReportUuid && <th>Author</th>}
                  {!selectedReportUuid && <th>Report</th>}
                  <th>Errors</th>
                  {!selectedReportUuid && <th />}
                </tr>
              </thead>
              <tbody>
                {martImportedReports.map((martImportedReport, index) => {
                  return (
                    <tr key={index}>
                      <td>{martImportedReport.sequence}</td>
                      <td>
                        {moment(martImportedReport.submittedAt).format(
                          Settings.dateFormats.forms.displayLong.withTime
                        )}
                      </td>
                      <td>
                        {moment(martImportedReport.receivedAt).format(
                          Settings.dateFormats.forms.displayLong.withTime
                        )}
                      </td>
                      <td>
                        <Icon
                          icon={
                            martImportedReport.state !== "NOT_RECEIVED"
                              ? IconNames.TICK
                              : IconNames.CROSS
                          }
                          className={
                            martImportedReport.state !== "NOT_RECEIVED"
                              ? "text-success"
                              : "text-danger"
                          }
                        />
                      </td>
                      <td>
                        {martImportedReport.state !== "NOT_RECEIVED" && (
                          <Icon
                            icon={
                              martImportedReport.state === "SUBMITTED_OK"
                                ? IconNames.TICK
                                : martImportedReport.state ===
                                    "SUBMITTED_WARNINGS"
                                  ? IconNames.WARNING_SIGN
                                  : IconNames.CROSS
                            }
                            className={
                              martImportedReport.state === "SUBMITTED_OK"
                                ? "text-success"
                                : martImportedReport.state ===
                                    "SUBMITTED_WARNINGS"
                                  ? "text-warning"
                                  : "text-danger"
                            }
                          />
                        )}
                      </td>
                      {!selectedReportUuid && (
                        <>
                          <td>
                            <LinkTo
                              modelType="Person"
                              model={martImportedReport.person}
                            />
                          </td>
                          <td>
                            <LinkTo
                              modelType="Report"
                              model={martImportedReport.report}
                            />
                          </td>
                        </>
                      )}
                      <td>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: martImportedReport.errors
                          }}
                        />
                      </td>
                      {!selectedReportUuid && (
                        <td>
                          {martImportedReport.report && (
                            <Button
                              id="history"
                              onClick={() =>
                                onSelectReport?.(martImportedReport)}
                              variant="primary"
                            >
                              History
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </UltimatePaginationTopDown>
        )}
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(MartImportedReportTable)
