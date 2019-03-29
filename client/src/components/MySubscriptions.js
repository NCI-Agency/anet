import React, { Component } from "react"
import PropTypes from "prop-types"
import { Table } from "react-bootstrap"
import GQL from "graphqlapi"

import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Page from "components/Page"
import UltimatePagination from "components/UltimatePagination"

import { showLoading, hideLoading } from "react-redux-loading-bar"
import { connect } from "react-redux"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import moment from "moment"
import pluralize from "pluralize"

class BaseMySubscriptions extends Component {
  static propTypes = {
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired
  }

  state = {
    mySubscriptions: []
  }

  render() {
    let subscriptions
    let numPages = 0
    if (this.state.mySubscriptions) {
      var { pageSize, pageNum, totalCount } = this.state.mySubscriptions
      numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
      subscriptions = this.state.mySubscriptions.list
      pageNum++
    }
    let subscriptionsExist = _get(subscriptions, "length", 0) > 0
    return (
      <Fieldset title="My Subscriptions">
        {subscriptionsExist ? (
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
              className="subscriptions_table"
            >
              <thead>
                <tr>
                  <th />
                  <th>Updated</th>
                  <th>Subscription</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(subscription => {
                  const updatedAt = moment(subscription.updatedAt).fromNow()
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
                        {Page.getSubscriptionIcon(
                          true,
                          this.toggleSubscription.bind(
                            this,
                            subscription.subscribedObjectType,
                            subscription.subscribedObjectUuid
                          )
                        )}
                      </td>
                      <td>{updatedAt}</td>
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

  fetchData() {
    this.props.showLoading()
    Promise.all([this.fetchSubscriptions()]).then(() =>
      this.props.hideLoading()
    )
  }

  fetchSubscriptions = () => {
    const subscriptionsQuery = {
      pageNum: this.state.pageNum,
      pageSize: 10
    }
    const subscriptionsPart = new GQL.Part(/* GraphQL */ `
			mySubscriptions(query: $subscriptionsQuery) {
				pageNum pageSize totalCount list {
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
			}`).addVariable(
      "subscriptionsQuery",
      "SubscriptionSearchQueryInput",
      subscriptionsQuery
    )

    return GQL.run([subscriptionsPart]).then(data =>
      this.setState({
        mySubscriptions: data.mySubscriptions
      })
    )
  }

  goToPage = newPage => {
    this.setState({ pageNum: newPage }, () => this.fetchSubscriptions())
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
)(BaseMySubscriptions)
