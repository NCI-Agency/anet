import { gqlPaginationFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
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
import utils from "utils"

const GQL_GET_PENDINGEMAILS = gql`
  query ($pageNum: Int!, $pageSize: Int!) {
    pendingEmails(pageNum: $pageNum, pageSize: $pageSize) {
      ${gqlPaginationFields}
      list {
        id
        toAddresses
        createdAt
        comment
        errorMessage
        type
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25

interface PendingEmailsShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const PendingEmailsShow = ({ pageDispatchers }: PendingEmailsShowProps) => {
  usePageTitle("Pending Emails")
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const { loading, error, data } = API.useApiQuery(GQL_GET_PENDINGEMAILS, {
    pageNum,
    pageSize
  })
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

  const { totalCount = 0, list: pendingEmails = [] } = data.pendingEmails
  const now = moment.utc()

  return (
    <Fieldset
      title="Pending Emails"
      action={
        <div className="float-end">
          Number per page:
          <FormSelect
            defaultValue={pageSize}
            onChange={e =>
              changePageSize(parseInt(e.target.value, 10) || DEFAULT_PAGESIZE)
            }
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
      {_isEmpty(pendingEmails) ? (
        <em>No pending emails found</em>
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
                <th>ID</th>
                <th>To</th>
                <th>Type</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Age (hours)</th>
                <th>Error Message</th>
              </tr>
            </thead>
            <tbody>
              {pendingEmails.map(email => {
                const createdAt = moment(email.createdAt)
                return (
                  <tr key={email.id}>
                    <td>{email.id}</td>
                    <td>
                      {email.toAddresses.map((addr, idx) => (
                        <div key={idx}>{utils.createMailtoLink(addr)}</div>
                      ))}
                    </td>
                    <td>{email.type}</td>
                    <td>{email.comment}</td>
                    <td className="text-nowrap">
                      {createdAt.format(
                        Settings.dateFormats.forms.displayShort.withTime
                      )}
                    </td>
                    <td>{moment.duration(now.diff(createdAt)).hours()}</td>
                    <td>{email.errorMessage}</td>
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

export default connect(null, mapPageDispatchersToProps)(PendingEmailsShow)
