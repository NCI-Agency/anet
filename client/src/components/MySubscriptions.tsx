import {
  gqlPaginationFields,
  gqlRelatedObjectFields,
  gqlSubscriptionFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import moment from "moment"
import React, { useEffect, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_MY_SUBSCRIPTIONS = gql`
  query ($subscriptionsQuery: SubscriptionSearchQueryInput) {
    mySubscriptions(query: $subscriptionsQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlSubscriptionFields}
        subscribedObject {
          ${gqlRelatedObjectFields}
        }
      }
    }
  }
`

interface MySubscriptionsProps {
  forceRefetch: boolean
  setForceRefetch: (...args: unknown[]) => unknown
  refetchCallback: (...args: unknown[]) => unknown
  pageDispatchers?: PageDispatchersPropType
}

const MySubscriptions = ({
  forceRefetch,
  setForceRefetch,
  refetchCallback,
  pageDispatchers
}: MySubscriptionsProps) => {
  const [saveError, setSaveError] = useState(null)
  const [pageNum, setPageNum] = useState(0)
  const subscriptionsQuery = {
    pageNum,
    pageSize: 10
  }
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_MY_SUBSCRIPTIONS,
    {
      subscriptionsQuery
    }
  )
  useEffect(() => {
    if (forceRefetch) {
      setForceRefetch(false)
      refetch()
    }
  }, [forceRefetch, setForceRefetch, refetch])
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Subscriptions")
  if (done) {
    return result
  }

  const paginatedSubscriptions = data.mySubscriptions
  const subscriptions = paginatedSubscriptions
    ? paginatedSubscriptions.list
    : []
  const { pageSize, totalCount } = paginatedSubscriptions
  const subscriptionsExist = totalCount > 0

  return (
    <Fieldset title="My Subscriptions">
      <Messages error={saveError} />
      {subscriptionsExist ? (
        <div>
          <UltimatePagination
            Component="header"
            componentClassName="searchPagination"
            className="float-end"
            pageNum={pageNum}
            pageSize={pageSize}
            totalCount={totalCount}
            goToPage={setPageNum}
          />

          <Table striped hover responsive className="subscriptions_table">
            <thead>
              <tr>
                <th />
                <th>Subscribed</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              {(_get(subscriptions, "length", 0) === 0 && (
                <tr>
                  <td colSpan={3}>nothing to show…</td>
                </tr>
              )) ||
                subscriptions.map(subscription => (
                  <tr key={subscription.uuid}>
                    <td>
                      <SubscriptionIcon
                        subscribedObjectType={subscription.subscribedObjectType}
                        subscribedObjectUuid={subscription.subscribedObjectUuid}
                        isSubscribed
                        updatedAt={null}
                        refetch={() => {
                          refetch()
                          refetchCallback()
                        }}
                        setError={error => setSaveError(error)}
                      />
                    </td>
                    <td>{moment(subscription.createdAt).fromNow()}</td>
                    <td>
                      <RelatedObjectDisplay
                        relatedObjectType={subscription.subscribedObjectType}
                        relatedObjectUuid={subscription.subscribedObjectUuid}
                        relatedObject={subscription.subscribedObject}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <em>No subscriptions found</em>
      )}
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(MySubscriptions)
