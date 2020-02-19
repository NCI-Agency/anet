import API from "api"
import { gql } from "apollo-boost"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  getSubscriptionIcon,
  mapPageDispatchersToProps,
  toggleSubscription,
  useBoilerplate
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import moment from "moment"
import pluralize from "pluralize"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_MY_SUBSCRIPTIONS = gql`
  query($subscriptionsQuery: SubscriptionSearchQueryInput) {
    mySubscriptions(query: $subscriptionsQuery) {
      pageNum
      pageSize
      totalCount
      list {
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
`

const BaseMySubscriptions = ({ pageDispatchers }) => {
  const [pageNum, setPageNum] = useState(0)
  const subscriptionsQuery = {
    pageNum: pageNum,
    pageSize: 10
  }
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_MY_SUBSCRIPTIONS,
    {
      subscriptionsQuery
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

  const paginatedSubscriptions = data.mySubscriptions
  const subscriptions = paginatedSubscriptions
    ? paginatedSubscriptions.list
    : []
  const { pageSize, totalCount } = paginatedSubscriptions
  const subscriptionsExist = _get(subscriptions, "length", 0) > 0

  return (
    <Fieldset title="My Subscriptions">
      {subscriptionsExist ? (
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
            className="subscriptions_table"
          >
            <thead>
              <tr>
                <th />
                <th>Subscribed</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(subscription => {
                const createdAt = moment(subscription.createdAt).fromNow()
                let objectType = pluralize.singular(
                  subscription.subscribedObjectType
                )
                if (objectType === "location") {
                  objectType = "anetLocation"
                }
                let linkTo
                if (subscription.subscribedObject) {
                  const linkToProps = {
                    [objectType]: {
                      uuid: subscription.subscribedObjectUuid,
                      ...subscription.subscribedObject
                    }
                  }
                  linkTo = <LinkTo {...linkToProps} />
                } else {
                  const linkToProps = {
                    componentClass: "span",
                    [objectType]: {
                      uuid: subscription.subscribedObjectUuid
                    }
                  }
                  linkTo = (
                    <LinkTo {...linkToProps}>[object was deleted]</LinkTo>
                  )
                }
                return (
                  <tr key={subscription.uuid}>
                    <td>
                      {getSubscriptionIcon(true, () =>
                        toggleSubscription(
                          subscription.subscribedObjectType,
                          subscription.subscribedObjectUuid,
                          true,
                          null,
                          refetch
                        )
                      )}
                    </td>
                    <td>{createdAt}</td>
                    <td>{linkTo}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <em>No subscriptions found</em>
      )}
    </Fieldset>
  )
}

BaseMySubscriptions.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(BaseMySubscriptions)
