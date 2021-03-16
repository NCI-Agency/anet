import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { setPageProps, setSearchProps } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import NotFound from "components/NotFound"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import { animateScroll, Link } from "react-scroll"

const GQL_CREATE_SUBSCRIPTION = gql`
  mutation($subscription: SubscriptionInput!) {
    createSubscription(subscription: $subscription) {
      uuid
    }
  }
`
const GQL_DELETE_OBJECT_SUBSCRIPTION = gql`
  mutation($subscribedObjectUuid: String!) {
    deleteObjectSubscription(uuid: $subscribedObjectUuid)
  }
`

export const mapPageDispatchersToProps = (dispatch, ownProps) => ({
  pageDispatchers: {
    showLoading: () => dispatch(showLoading()),
    hideLoading: () => dispatch(hideLoading()),
    setPageProps: pageProps => dispatch(setPageProps(pageProps)),
    setSearchProps: searchProps => dispatch(setSearchProps(searchProps))
  }
})

export const PageDispatchersPropType = PropTypes.shape({
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
  setPageProps: PropTypes.func.isRequired,
  setSearchProps: PropTypes.func.isRequired
}).isRequired

export const AnchorLink = ({ to, children }) => (
  <Link to={to} smooth duration={500} containerId="main-viewport">
    {children}
  </Link>
)

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

export const useBoilerplate = ({
  loading,
  pageProps,
  searchProps,
  error,
  modelName,
  uuid,
  pageDispatchers: { showLoading, hideLoading, setPageProps, setSearchProps }
}) => {
  useEffect(
    () => {
      applyPageProps(setPageProps, pageProps)
      applySearchProps(setSearchProps, searchProps)
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )
  useEffect(
    () => {
      toggleLoading(loading, showLoading, hideLoading)
      return function cleanup() {
        // Make sure loading indicator is hidden when 'unmounting'
        toggleLoading(false, showLoading, hideLoading)
      }
    },
    [loading] // eslint-disable-line react-hooks/exhaustive-deps
  )
  if (loading) {
    return { done: true, result: <div className="loader" /> }
  }
  if (error) {
    return {
      done: true,
      result: renderError(error, modelName, uuid)
    }
  }
  return { done: false }
}

const renderError = (error, modelName, uuid) => {
  if (error.status === 404) {
    const text = modelName ? `${modelName} #${uuid}` : "Page"
    return <NotFound text={`${text} not found.`} />
  }
  if (error.status === 500) {
    return (
      <NotFound text="There was an error processing this request. Please contact an administrator." />
    )
  }
  return `${error.message}`
}

const toggleLoading = (loading, showLoading, hideLoading) => {
  if (loading) {
    showLoading()
  } else {
    hideLoading()
  }
}

const applyPageProps = (setPageProps, pageProps) => {
  if (pageProps) {
    setPageProps(Object.assign({}, pageProps))
  }
}

const applySearchProps = (setSearchProps, searchProps) => {
  if (searchProps) {
    setSearchProps(Object.assign({}, searchProps))
  }
}

export const getSubscriptionIcon = (isSubscribed, onClick) => {
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

export const toggleSubscription = (
  subscribedObjectType,
  subscribedObjectUuid,
  isSubscribed,
  updatedAt,
  refetch
) => {
  const variables = isSubscribed
    ? { subscribedObjectUuid }
    : {
      subscription: {
        subscribedObjectType,
        subscribedObjectUuid,
        updatedAt
      }
    }
  return API.mutation(
    isSubscribed ? GQL_DELETE_OBJECT_SUBSCRIPTION : GQL_CREATE_SUBSCRIPTION,
    variables
  ).then(data => refetch())
}
