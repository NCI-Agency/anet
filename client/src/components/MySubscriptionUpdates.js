import { gql } from "@apollo/client"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import pluralize from "pluralize"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_MY_SUBSCRIPTION_UPDATES = gql`
  query($subscriptionUpdatesQuery: SubscriptionUpdateSearchQueryInput) {
    mySubscriptionUpdates(query: $subscriptionUpdatesQuery) {
      pageNum
      pageSize
      totalCount
      list {
        createdAt
        updatedObjectType
        updatedObjectUuid
        updatedObject {
          ... on Location {
            name
          }
          ... on Organization {
            shortName
          }
          ... on Person {
            role
            rank
            name
          }
          ... on Position {
            type
            name
          }
          ... on Report {
            intent
          }
          ... on Task {
            shortName
            longName
          }
        }
        isNote
        subscription {
          uuid
          createdAt
          updatedAt
          subscribedObjectType
          subscribedObjectUuid
          subscribedObject {
            ... on Location {
              name
            }
            ... on Organization {
              shortName
            }
            ... on Person {
              role
              rank
              name
            }
            ... on Position {
              type
              name
            }
            ... on Report {
              intent
            }
            ... on Task {
              shortName
              longName
            }
          }
        }
      }
    }
  }
`

const MySubscriptionUpdates = ({ pageDispatchers }) => {
  const [saveError, setSaveError] = useState(null)
  const [pageNum, setPageNum] = useState(0)
  const subscriptionUpdatesQuery = {
    pageNum: pageNum,
    pageSize: 10
  }
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_MY_SUBSCRIPTION_UPDATES,
    {
      subscriptionUpdatesQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const paginatedSubscriptionUpdates = data.mySubscriptionUpdates
  const subscriptionUpdates = paginatedSubscriptionUpdates
    ? paginatedSubscriptionUpdates.list
    : []
  const { pageSize, totalCount } = paginatedSubscriptionUpdates
  const subscriptionUpdatesExist = _get(subscriptionUpdates, "length", 0) > 0

  return (
    <Fieldset title="My Subscription Updates">
      <Messages error={saveError} />
      {subscriptionUpdatesExist ? (
        <div>
          <UltimatePagination
            Component="header"
            componentClassName="searchPagination"
            className="pull-right"
            pageNum={pageNum}
            pageSize={pageSize}
            totalCount={totalCount}
            goToPage={setPageNum}
          />

          <Table
            striped
            condensed
            hover
            responsive
            className="subscriptionUpdates_table"
          >
            <thead>
              <tr>
                <th />
                <th>Subscription</th>
                <th>Updated</th>
                <th>Through</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionUpdates.map(subscriptionUpdate => {
                const subscription = subscriptionUpdate.subscription
                const subscribedObjectType = _upperFirst(
                  pluralize.singular(subscription.subscribedObjectType)
                )
                let linkToSubscription
                if (subscription.subscribedObject) {
                  linkToSubscription = (
                    <LinkTo
                      modelType={subscribedObjectType}
                      model={{
                        uuid: subscription.subscribedObjectUuid,
                        ...subscription.subscribedObject
                      }}
                    />
                  )
                } else {
                  linkToSubscription = (
                    <LinkTo
                      componentClass="span"
                      modelType={subscribedObjectType}
                      model={{
                        uuid: subscription.subscribedObjectUuid
                      }}
                    >
                      [object was deleted]
                    </LinkTo>
                  )
                }
                const updatedObjectType = _upperFirst(
                  pluralize.singular(subscriptionUpdate.updatedObjectType)
                )
                let linkToUpdatedObject
                if (subscriptionUpdate.updatedObject) {
                  linkToUpdatedObject = (
                    <LinkTo
                      modelType={updatedObjectType}
                      model={{
                        uuid: subscriptionUpdate.updatedObjectUuid,
                        ...subscriptionUpdate.updatedObject
                      }}
                    />
                  )
                } else {
                  linkToUpdatedObject = (
                    <LinkTo
                      componentClass="span"
                      modelType={updatedObjectType}
                      model={{
                        uuid: subscriptionUpdate.updatedObjectUuid
                      }}
                    >
                      [object was deleted]
                    </LinkTo>
                  )
                }
                if (subscriptionUpdate.isNote) {
                  linkToUpdatedObject = (
                    <span>Note on {linkToUpdatedObject}</span>
                  )
                }
                const key = `${subscriptionUpdate.createdAt}:${subscription.uuid}`
                return (
                  <tr key={key}>
                    <td>
                      {
                        <SubscriptionIcon
                          subscribedObjectType={
                            subscription.subscribedObjectType
                          }
                          subscribedObjectUuid={
                            subscription.subscribedObjectUuid
                          }
                          isSubscribed={true}
                          updatedAt={null}
                          refetch={refetch}
                          setError={error => setSaveError(error)}
                        />
                      }
                    </td>
                    <td>{linkToSubscription}</td>
                    <td>{moment(subscriptionUpdate.createdAt).fromNow()}</td>
                    <td>{linkToUpdatedObject}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <em>No subscription updates found</em>
      )}
    </Fieldset>
  )
}

MySubscriptionUpdates.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MySubscriptionUpdates)
