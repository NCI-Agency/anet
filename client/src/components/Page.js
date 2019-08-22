import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  setPageProps,
  setPagination,
  setSearchProps
} from "actions"
import API from "api"
import autobind from "autobind-decorator"
import { setMessages } from "components/Messages"
import NotFound from "components/NotFound"
import _isEmpty from "lodash/isEmpty"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import { animateScroll, Link } from "react-scroll"
import utils from "utils"

export const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading()),
  setPageProps: pageProps => dispatch(setPageProps(pageProps)),
  setSearchProps: searchProps => dispatch(setSearchProps(searchProps)),
  setPagination: (pageKey, pageNum) => dispatch(setPagination(pageKey, pageNum))
})

export const routerRelatedPropTypes = {
  location: PropTypes.object,
  history: PropTypes.object.isRequired
}

export const propTypes = {
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
  setPageProps: PropTypes.func.isRequired,
  setSearchProps: PropTypes.func.isRequired,
  searchQuery: PropTypes.shape({
    text: PropTypes.string,
    filters: PropTypes.any,
    objectType: PropTypes.string
  }),
  /* eslint-disable react/no-unused-prop-types */
  /* FIXME: refactor setting the pagination, maybe use a container component */
  setPagination: PropTypes.func.isRequired,
  /* eslint-enable react/no-unused-prop-types */
  ...routerRelatedPropTypes
}

export const AnchorLink = function(props) {
  const { to, children, ...remainingProps } = props
  return (
    <Link
      to={to}
      smooth
      duration={500}
      containerId="main-viewport"
      {...remainingProps}
    >
      {props.children}
    </Link>
  )
}
AnchorLink.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node
}

export function jumpToTop() {
  animateScroll.scrollToTop({
    duration: 500,
    delay: 100,
    smooth: "easeInOutQuint",
    containerId: "main-viewport"
  })
}

export default class Page extends Component {
  constructor(props, pageProps, searchProps) {
    super(props)
    const pp = _isEmpty(pageProps) ? DEFAULT_PAGE_PROPS : pageProps
    const sp = _isEmpty(searchProps) ? DEFAULT_SEARCH_PROPS : searchProps
    if (typeof props.setPageProps === "function") {
      props.setPageProps(Object.assign({}, pp))
    }
    if (typeof props.setSearchProps === "function") {
      props.setSearchProps(Object.assign({}, sp))
    }
    this.state = {
      notFound: false,
      invalidRequest: false,
      loadCount: null
    }

    this.renderPage = this.render
    this.render = Page.prototype.render
  }

  incrementRefCount = refCount => (refCount ? refCount + 1 : 1)

  decrementRefCount = refCount => (refCount ? refCount - 1 : 0)

  @autobind
  loadData() {
    this.setState({
      notFound: false,
      invalidRequest: false,
      loadCount: this.incrementRefCount(this.state.loadCount)
    })

    if (this.fetchData) {
      document.body.classList.add("loading")
      if (typeof this.props.showLoading === "function") {
        this.props.showLoading()
      }

      const promise = this.fetchData(this.props)

      if (promise && promise.then instanceof Function) {
        promise.then(this.doneLoading, this.doneLoading)
      } else {
        this.doneLoading()
      }

      return promise
    } else {
      this.doneLoading()
    }
  }

  @autobind
  doneLoading(response) {
    if (typeof this.props.hideLoading === "function") {
      this.props.hideLoading()
    }
    document.body.classList.remove("loading")

    if (response) {
      if (response.status === 404) {
        this.setState({
          notFound: true,
          loadCount: this.decrementRefCount(this.state.loadCount)
        })
      } else if (response.status === 500) {
        this.setState({
          invalidRequest: true,
          loadCount: this.decrementRefCount(this.state.loadCount)
        })
      }
    } else {
      this.setState({ loadCount: this.decrementRefCount(this.state.loadCount) })
    }

    return response
  }

  render() {
    if (this.state.loadCount !== 0) {
      return null
    }
    if (this.state.notFound) {
      let modelName = this.constructor.modelName
      let text = modelName
        ? `${modelName} #${this.props.match.params.uuid}`
        : "Page"
      return <NotFound text={`${text} not found.`} />
    } else if (this.state.invalidRequest) {
      return (
        <NotFound text="There was an error processing this request. Please contact an administrator." />
      )
    } else {
      return this.renderPage()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Filter out React Router props before comparing; for the property names,
    // see https://github.com/ReactTraining/react-router/issues/4424#issuecomment-285809552
    const propFilter = ["match", "location", "history"]
    // Also filter out generic pageProps
    propFilter.push("pageProps")
    propFilter.push("pagination")
    const filteredNextProps = Object.without(this.props, ...propFilter)
    const filteredProps = Object.without(prevProps, ...propFilter)
    if (
      !_isEqualWith(
        filteredProps,
        filteredNextProps,
        utils.treatFunctionsAsEqual
      )
    ) {
      this.loadData()
    } else {
      // Location always has a new key. In order to check whether the location
      // really changed filter out the key.
      // When location has a changed has we do not need to reload the data.
      // We do not make use of the location state, therefore we ignore it for now
      // as otherwise a change from no state to empty state would result in
      // reloading the data and we do not want that.
      const locationFilterProps = ["key", "hash", "state"]
      const nextPropsFilteredLocation = Object.without(
        this.props.location,
        ...locationFilterProps
      )
      const propsFilteredLocation = Object.without(
        prevProps.location,
        ...locationFilterProps
      )
      if (
        !_isEqualWith(
          propsFilteredLocation,
          nextPropsFilteredLocation,
          utils.treatFunctionsAsEqual
        )
      ) {
        this.loadData()
      }
    }
  }

  componentDidMount() {
    setMessages(this.props, this.state)
    this.loadData()
  }

  @autobind
  getSearchQuery(props) {
    let { searchQuery } = props || this.props
    let query = {}
    if (!_isEmpty(searchQuery.text)) {
      query.text = searchQuery.text
    }
    if (searchQuery.filters) {
      searchQuery.filters.forEach(filter => {
        if (filter.value) {
          if (filter.value.toQuery) {
            const toQuery =
              typeof filter.value.toQuery === "function"
                ? filter.value.toQuery()
                : filter.value.toQuery
            Object.assign(query, toQuery)
          } else {
            query[filter.key] = filter.value
          }
        }
      })
    }
    console.log("SEARCH advanced query", query)

    return query
  }

  static getSubscriptionIcon = (isSubscribed, onClick) => {
    const tooltip = isSubscribed ? "Click to unsubscribe" : "Click to subscribe"
    const icon = isSubscribed ? IconNames.FEED_SUBSCRIBED : IconNames.FEED
    // or perhaps: const icon = isSubscribed ? IconNames.EYE_ON : IconNames.EYE_OFF
    const color = isSubscribed ? "green" : "grey"
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id="subscribe">{tooltip}</Tooltip>}
      >
        <Icon
          icon={icon}
          color={color}
          style={{ verticalAlign: "middle", cursor: "pointer" }}
          onClick={onClick}
        />
      </OverlayTrigger>
    )
  }

  static toggleSubscriptionCommon = (
    subscribedObjectType,
    subscribedObjectUuid,
    isSubscribed,
    updatedAt
  ) => {
    let graphql, variables, variableDef
    if (isSubscribed) {
      graphql = "deleteObjectSubscription(uuid: $subscribedObjectUuid)"
      variables = { subscribedObjectUuid }
      variableDef = "($subscribedObjectUuid: String!)"
    } else {
      graphql = "createSubscription(subscription: $subscription) { uuid }"
      variables = {
        subscription: {
          subscribedObjectType,
          subscribedObjectUuid,
          updatedAt
        }
      }
      variableDef = "($subscription: SubscriptionInput!)"
    }
    return API.mutation(graphql, variables, variableDef)
  }
}

Page.propTypes = propTypes
