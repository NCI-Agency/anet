import {
  gqlEntityFieldsMap,
  gqlPaginationFields,
  gqlRelatedObjectFields,
  gqlSubscribableObjectFields,
  gqlSubscriptionFields,
  gqlSubscriptionUpdateFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { AUDIT_TRAIL_UPDATE_TYPE_DESCRIPTION } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate
} from "components/Page"
import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import UltimatePagination from "components/UltimatePagination"
import _get from "lodash/get"
import moment from "moment"
import React, { useEffect, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_MY_SUBSCRIPTION_UPDATES = gql`
  query ($subscriptionUpdatesQuery: SubscriptionUpdateSearchQueryInput) {
    mySubscriptionUpdates(query: $subscriptionUpdatesQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlSubscriptionUpdateFields}
        updatedObject {
          ${gqlSubscribableObjectFields}
        }
        subscription {
          ${gqlSubscriptionFields}
          subscribedObject {
            ${gqlSubscribableObjectFields}
          }
        }
        auditTrail {
          uuid
          createdAt
          updateType
          objectUuid
          updateDescription
          updateDetails
          relatedObjectType
          relatedObjectUuid
          person {
            ${gqlEntityFieldsMap.Person}
          }
          relatedObject {
            ${gqlRelatedObjectFields}
          }
        }
      }
    }
  }
`

const SPECIAL_MODELS = {
  assessments: "an Assessment",
  notes: "a Note"
}

interface MySubscriptionUpdatesProps {
  forceRefetch?: boolean
  setForceRefetch?: (...args: unknown[]) => unknown
  refetchCallback?: (...args: unknown[]) => unknown
  pageDispatchers?: PageDispatchersPropType
}

const MySubscriptionUpdates = ({
  forceRefetch,
  setForceRefetch,
  refetchCallback,
  pageDispatchers
}: MySubscriptionUpdatesProps) => {
  const [saveError, setSaveError] = useState(null)
  const [pageNum, setPageNum] = useState(0)
  const subscriptionUpdatesQuery = {
    pageNum,
    pageSize: 10
  }
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_MY_SUBSCRIPTION_UPDATES,
    {
      subscriptionUpdatesQuery
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
  if (done) {
    return result
  }

  const paginatedSubscriptionUpdates = data.mySubscriptionUpdates
  const subscriptionUpdates = paginatedSubscriptionUpdates
    ? paginatedSubscriptionUpdates.list
    : []
  const { pageSize, totalCount } = paginatedSubscriptionUpdates
  const subscriptionUpdatesExist = totalCount > 0

  return (
    <Fieldset title="My Subscription Updates">
      <Messages error={saveError} />
      {subscriptionUpdatesExist ? (
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

          <Table striped hover responsive className="subscriptionUpdates_table">
            <tbody>
              {(_get(subscriptionUpdates, "length", 0) === 0 && (
                <tr>
                  <td colSpan={2}>nothing to show…</td>
                </tr>
              )) ||
                subscriptionUpdates.map(subscriptionUpdate => {
                  const subscription = subscriptionUpdate.subscription
                  const at = subscriptionUpdate.auditTrail
                  const key = `${subscriptionUpdate.createdAt}:${subscription.uuid}`
                  return (
                    <React.Fragment key={key}>
                      <tr>
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
                              if (typeof refetchCallback === "function") {
                                refetchCallback()
                              }
                            }}
                            setError={error => setSaveError(error)}
                          />
                        </td>
                        <td>
                          {"Your subscription to "}
                          <RelatedObjectDisplay
                            relatedObjectType={
                              subscription.subscribedObjectType
                            }
                            relatedObjectUuid={
                              subscription.subscribedObjectUuid
                            }
                            relatedObject={subscription.subscribedObject}
                          />
                          {" was updated "}
                          {moment(subscriptionUpdate.createdAt).fromNow()},
                          {" because "}
                          {at ? (
                            <>
                              {at.relatedObjectType ===
                                subscription.subscribedObjectType &&
                              at.relatedObjectUuid ===
                                subscription.subscribedObjectUuid ? (
                                "it"
                              ) : (
                                <RelatedObjectDisplay
                                  relatedObjectType={at.relatedObjectType}
                                  relatedObjectUuid={at.relatedObjectUuid}
                                  relatedObject={at.relatedObject}
                                  specialModels={SPECIAL_MODELS}
                                />
                              )}
                              {" was "}
                              <b>
                                {
                                  AUDIT_TRAIL_UPDATE_TYPE_DESCRIPTION[
                                    at.updateType
                                  ]
                                }
                              </b>
                              {at.objectUuid && (
                                <>
                                  {" by "}
                                  <RelatedObjectDisplay
                                    relatedObjectType="people"
                                    relatedObjectUuid={at.objectUuid}
                                    relatedObject={at.person}
                                  />
                                </>
                              )}
                              {at.updateDescription && (
                                <>: {at.updateDescription}</>
                              )}
                              {at.updateDetails && (
                                <>, with details: {at.updateDetails}</>
                              )}
                            </>
                          ) : (
                            <>
                              {" "}
                              {subscriptionUpdate.isNote ? (
                                <>
                                  of a <b>note/assessment</b> on it
                                </>
                              ) : (
                                <>
                                  of a <b>change</b> to{" "}
                                  <RelatedObjectDisplay
                                    relatedObjectType={
                                      subscriptionUpdate.updatedObjectType
                                    }
                                    relatedObjectUuid={
                                      subscriptionUpdate.updatedObjectUuid
                                    }
                                    relatedObject={
                                      subscriptionUpdate.updatedObject
                                    }
                                  />
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
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

export default connect(null, mapPageDispatchersToProps)(MySubscriptionUpdates)
