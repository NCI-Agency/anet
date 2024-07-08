import { gql } from "@apollo/client"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import _upperFirst from "lodash/upperFirst"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_MY_SUBSCRIPTIONS = gql`
  query ($subscriptionsQuery: SubscriptionSearchQueryInput) {
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
          ... on AuthorizationGroup {
            name
          }
          ... on Location {
            name
          }
          ... on Organization {
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Person {
            name
            rank
            avatarUuid
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

const MySubscriptions = ({
  forceRefetch,
  setForceRefetch,
  refetchCallback,
  pageDispatchers
}) => {
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
                  <td colSpan="3">nothing to show…</td>
                </tr>
              )) ||
                subscriptions.map(subscription => {
                  const createdAt = moment(subscription.createdAt).fromNow()
                  const objectType = _upperFirst(
                    pluralize.singular(subscription.subscribedObjectType)
                  )
                  let linkTo
                  if (subscription.subscribedObject) {
                    linkTo = (
                      <LinkTo
                        modelType={objectType}
                        model={{
                          uuid: subscription.subscribedObjectUuid,
                          ...subscription.subscribedObject
                        }}
                      />
                    )
                  } else {
                    linkTo = (
                      <LinkTo
                        componentClass="span"
                        modelType={objectType}
                        model={{
                          uuid: subscription.subscribedObjectUuid
                        }}
                      >
                        [object was deleted]
                      </LinkTo>
                    )
                  }
                  return (
                    <tr key={subscription.uuid}>
                      <td>
                        <SubscriptionIcon
                          subscribedObjectType={
                            subscription.subscribedObjectType
                          }
                          subscribedObjectUuid={
                            subscription.subscribedObjectUuid
                          }
                          isSubscribed
                          updatedAt={null}
                          refetch={() => {
                            refetch()
                            refetchCallback()
                          }}
                          setError={error => setSaveError(error)}
                        />
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

MySubscriptions.propTypes = {
  forceRefetch: PropTypes.bool.isRequired,
  setForceRefetch: PropTypes.func.isRequired,
  refetchCallback: PropTypes.func.isRequired,
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MySubscriptions)
