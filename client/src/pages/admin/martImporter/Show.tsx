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
  query ($pageNum: Int!, $pageSize: Int!, $states: [String], $sortBy: String, $sortOrder: String) {
    martImportedReports(pageNum: $pageNum, pageSize: $pageSize, states: $states, sortBy: $sortBy, sortOrder: $sortOrder) {
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
        success
        submittedAt
        receivedAt
        errors
      }
    }
  }
`
const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25
const FILTER_OPTIONS = [
  { value: "", label: "" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "failure", label: "Failure" },
  { value: "success_warning", label: "Success and Warning" },
  { value: "warning_failure", label: "Warning and Failure" }
]

const filterToStates = {
  "": null,
  success: ["success"],
  warning: ["warning"],
  failure: ["failure"],
  success_warning: ["success", "warning"],
  warning_failure: ["warning", "failure"]
}

interface MartImportedReportsShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const MartImporterShow = ({
  pageDispatchers
}: MartImportedReportsShowProps) => {
  usePageTitle("MART reports imported")
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [sortBy, setSortBy] = useState("sequence")
  const [sortOrder, setSortOrder] = useState("desc")
  const [stateFilter, setStateFilter] = useState("")
  const states = filterToStates[stateFilter]

  const { loading, error, data } = API.useApiQuery(
    GQL_GET_MART_REPORTS_IMPORTED,
    {
      pageNum,
      pageSize,
      states,
      sortBy,
      sortOrder
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

  const { totalCount = 0, list: martImportedReports = [] } =
    data.martImportedReports || {}

  const handlePageSizeChange = newPageSize => {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }

  const handleSortByChange = e => {
    setSortBy(e.target.value)
    setPageNum(0)
  }

  const handleSortOrderChange = e => {
    setSortOrder(e.target.value)
    setPageNum(0)
  }

  const handleStateFilterChange = e => {
    setStateFilter(e.target.value)
    setPageNum(0)
  }

  const getState = report => {
    if (report.success) {
      return "success"
    } else if (report.errors && report.errors.startsWith("While importing")) {
      return "warning"
    } else if (report.errors && !report.errors.startsWith("While importing")) {
      return "failure"
    } else {
      return "unknown"
    }
  }

  return (
    <>
      <Button variant="primary">
        <a
          href="/api/admin/dictionary/mart"
          style={{
            color: "white",
            padding: "6px 12px",
            textDecoration: "none"
          }}
        >
          Export Dictionary for MART
        </a>
      </Button>
      <Fieldset
        title="MART reports imported"
        action={
          <div className="float-end d-flex align-items-center gap-3">
            <div>
              Filter by state:
              <FormSelect
                value={stateFilter}
                onChange={handleStateFilterChange}
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              Sort by:
              <FormSelect value={sortBy} onChange={handleSortByChange}>
                <option value="sequence">Sequence</option>
                <option value="submittedAt">Submitted At</option>
                <option value="receivedAt">Received At</option>
              </FormSelect>
            </div>
            <div>
              Order:
              <FormSelect value={sortOrder} onChange={handleSortOrderChange}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
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
                  <th>State</th>
                  <th>Author</th>
                  <th>Report</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {martImportedReports.map((martImportedReport, index) => (
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
                      {(() => {
                        const state = getState(martImportedReport)
                        if (state === "success") {
                          return (
                            <Icon
                              icon={IconNames.TICK}
                              className="text-success"
                            />
                          )
                        } else if (state === "warning") {
                          return (
                            <Icon
                              icon={IconNames.WARNING_SIGN}
                              className="text-warning"
                            />
                          )
                        } else if (state === "failure") {
                          return (
                            <Icon
                              icon={IconNames.CROSS}
                              className="text-danger"
                            />
                          )
                        } else {
                          return <span>Unknown</span>
                        }
                      })()}
                    </td>
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
                    <td>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: martImportedReport.errors
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </UltimatePaginationTopDown>
        )}
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(MartImporterShow)
