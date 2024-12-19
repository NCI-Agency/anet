import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
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
import { FormSelect, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_MART_REPORTS_IMPORTED = gql`
  query ($pageNum: Int!, $pageSize: Int!) {
    martImportedReports(pageNum: $pageNum, pageSize: $pageSize) {
      pageNum
      pageSize
      totalCount
      list {
        person {
          uuid
          name
          rank
        }
        report {
          uuid
          intent
        }
        success
        createdAt
        errors
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25

interface MartImportedReportsShowProps {
  pageDispatchers?: PageDispatchersPropType
}
const MartImportedReportsShow = ({
  pageDispatchers
}: MartImportedReportsShowProps) => {
  usePageTitle("MART reports imported")
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_MART_REPORTS_IMPORTED,
    {
      pageNum,
      pageSize
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
    data.martImportedReports

  function getErrors(martImportedReport) {
    return { __html: martImportedReport.errors }
  }

  return (
    <Fieldset
      title="MART reports imported"
      action={
        <div className="float-end">
          Number per page:
          <FormSelect
            defaultValue={pageSize}
            onChange={e =>
              changePageSize(parseInt(e.target.value, 10) || DEFAULT_PAGESIZE)}
          >
            {PAGESIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </FormSelect>
        </div>
      }
    >
      {_isEmpty(martImportedReports) ? (
        <em>No mart reports imported found</em>
      ) : (
        <UltimatePaginationTopDown
          Component="header"
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
                <th>Author</th>
                <th>Report</th>
                <th>Insert Date</th>
                <th>Success</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {martImportedReports.map((martImportedReport, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <div>
                        <h4 className="assigned-person-name">
                          <LinkTo
                            modelType="Person"
                            model={martImportedReport.person}
                          />
                        </h4>
                        <p />
                      </div>
                    </td>
                    <td>
                      {martImportedReport.report && (
                        <LinkTo
                          modelType="Report"
                          model={martImportedReport.report}
                        />
                      )}
                    </td>
                    <td>
                      {moment(martImportedReport.createdAt).format(
                        Settings.dateFormats.forms.displayLong.withTime
                      )}
                    </td>
                    <td>{martImportedReport.success && "true"}</td>
                    <td>
                      <div
                        dangerouslySetInnerHTML={getErrors(martImportedReport)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </UltimatePaginationTopDown>
      )}
    </Fieldset>
  )

  function changePageSize(newPageSize) {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }
}

export default connect(null, mapPageDispatchersToProps)(MartImportedReportsShow)
