import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Page from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import GQL from "graphqlapi"
import _get from "lodash/get"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import { hideLoading, showLoading } from "react-redux-loading-bar"

class BaseMySubscriptionUpdates extends Component {
  static propTypes = {
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired
  }

  state = {
    mySubscriptionUpdates: []
  }

  render() {
    let subscriptionUpdates
    let numPages = 0
    if (this.state.mySubscriptionUpdates) {
      var { pageSize, pageNum, totalCount } = this.state.mySubscriptionUpdates
      numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
      subscriptionUpdates = this.state.mySubscriptionUpdates.list
      pageNum++
    }
    let subscriptionUpdatesExist = _get(subscriptionUpdates, "length", 0) > 0
    return (
      <Fieldset title="My Subscription Updates">
        {subscriptionUpdatesExist ? (
          <div>
            {numPages > 1 && (
              <header className="searchPagination">
                <UltimatePagination
                  className="pull-right"
                  currentPage={pageNum}
                  totalPages={numPages}
                  boundaryPagesRange={1}
                  siblingPagesRange={2}
                  hideEllipsis={false}
                  hidePreviousAndNextPageLinks={false}
                  hideFirstAndLastPageLinks
                  onChange={value => this.goToPage(value - 1)}
                />
              </header>
            )}

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
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionUpdates.map(subscriptionUpdate => {
                  const subscription = subscriptionUpdate.subscription
                  let subscribedObjectType = pluralize.singular(
                    subscription.subscribedObjectType
                  )
                  if (subscribedObjectType === "location") {
                    subscribedObjectType = "anetLocation"
                  }
                  let linkToSubscription
                  if (subscription.subscribedObject) {
                    const linkToProps = {
                      [subscribedObjectType]: {
                        uuid: subscription.subscribedObjectUuid,
                        ...subscription.subscribedObject
                      }
                    }
                    linkToSubscription = <LinkTo {...linkToProps} />
                  } else {
                    const linkToProps = {
                      componentClass: "span",
                      [subscribedObjectType]: {
                        uuid: subscription.subscribedObjectUuid
                      }
                    }
                    linkToSubscription = (
                      <LinkTo {...linkToProps}>[object was deleted]</LinkTo>
                    )
                  }
                  let updatedObjectType = pluralize.singular(
                    subscriptionUpdate.updatedObjectType
                  )
                  if (updatedObjectType === "location") {
                    updatedObjectType = "anetLocation"
                  }
                  let linkToUpdatedObject
                  if (subscriptionUpdate.updatedObject) {
                    const linkToProps = {
                      [updatedObjectType]: {
                        uuid: subscriptionUpdate.updatedObjectUuid,
                        ...subscriptionUpdate.updatedObject
                      }
                    }
                    linkToUpdatedObject = <LinkTo {...linkToProps} />
                    if (subscriptionUpdate.isNote) {
                      linkToUpdatedObject = (
                        <span>Note on {linkToUpdatedObject}</span>
                      )
                    }
                  } else {
                    const linkToProps = {
                      componentClass: "span",
                      [updatedObjectType]: {
                        uuid: subscriptionUpdate.updatedObjectUuid
                      }
                    }
                    linkToUpdatedObject = (
                      <LinkTo {...linkToProps}>[object was deleted]</LinkTo>
                    )
                  }
                  const key = `${subscriptionUpdate.createdAt}:${subscriptionUpdate.updatedObjectType}:${subscriptionUpdate.updatedObjectUuid}`
                  return (
                    <tr key={key}>
                      <td>
                        {Page.getSubscriptionIcon(
                          true,
                          this.toggleSubscription.bind(
                            this,
                            subscription.subscribedObjectType,
                            subscription.subscribedObjectUuid
                          )
                        )}
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

  fetchData() {
    this.props.showLoading()
    Promise.all([this.fetchSubscriptionUpdates()]).then(() =>
      this.props.hideLoading()
    )
  }

  fetchSubscriptionUpdates = () => {
    const subscriptionUpdatesQuery = {
      pageNum: this.state.pageNum,
      pageSize: 10
    }
    const subscriptionUpdatesPart = new GQL.Part(/* GraphQL */ `
      mySubscriptionUpdates(query: $subscriptionUpdatesQuery) {
        pageNum pageSize totalCount list {
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
      }`).addVariable(
      "subscriptionUpdatesQuery",
      "SubscriptionUpdateSearchQueryInput",
      subscriptionUpdatesQuery
    )

    return GQL.run([subscriptionUpdatesPart]).then(data =>
      this.setState({
        mySubscriptionUpdates: data.mySubscriptionUpdates
      })
    )
  }

  goToPage = newPage => {
    this.setState({ pageNum: newPage }, () => this.fetchSubscriptionUpdates())
  }

  componentDidMount() {
    this.setState(
      {
        pageNum: 0
      },
      () => this.fetchData()
    )
  }

  toggleSubscription = (subscribedObjectType, subscribedObjectUuid) => {
    return Page.toggleSubscriptionCommon(
      subscribedObjectType,
      subscribedObjectUuid,
      true,
      null
    ).then(data => {
      this.setState(
        {
          pageNum: 0
        },
        () => this.fetchData()
      )
    })
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
})

export default connect(
  null,
  mapDispatchToProps
)(BaseMySubscriptionUpdates)
