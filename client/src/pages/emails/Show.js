import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import moment from "moment"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_EMAILS = gql`
  query {
    pendingEmails {
      id
      toAddresses
      createdAt
      comment
      errorMessage
    }
  }
`

const EmailQueueShow = ({ pageDispatchers }) => {
  usePageTitle("Email queue")
  const { loading, error, data } = API.useApiQuery(GQL_GET_EMAILS)
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

  return (
    <Table striped responsive>
      <tbody>
        <tr>
          <th style={{ border: "none" }}>ID</th>
          <th style={{ border: "none" }}>To</th>
          <th style={{ border: "none" }}>Date</th>
          <th style={{ border: "none" }}>Comment</th>
          <th style={{ border: "none" }}>Error Message</th>
        </tr>
        {data.pendingEmails.map(email => (
          <tr key={email.id}>
            <td>{email.id}</td>
            <td>{email.toAddresses}</td>
            <td>
              {moment(email.createdAt).format(
                Settings.dateFormats.email.withTime
              )}
            </td>
            <td>{email.comment}</td>
            <td>{email.errorMessage}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

EmailQueueShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(EmailQueueShow)
