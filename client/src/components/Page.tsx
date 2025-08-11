import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { setPageProps, setSearchProps } from "actions"
import API from "api"
import NotFound from "components/NotFound"
import React, { useEffect, useState } from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import { animateScroll, Link } from "react-scroll"

const GQL_CREATE_SUBSCRIPTION = gql`
  mutation ($subscription: SubscriptionInput!) {
    createSubscription(subscription: $subscription) {
      uuid
    }
  }
`
const GQL_DELETE_OBJECT_SUBSCRIPTION = gql`
  mutation ($subscribedObjectUuid: String!) {
    deleteObjectSubscription(uuid: $subscribedObjectUuid)
  }
`

export const mapPageDispatchersToProps = dispatch => ({
  pageDispatchers: {
    showLoading: () => dispatch(showLoading()),
    hideLoading: () => dispatch(hideLoading()),
    setPageProps: pageProps => dispatch(setPageProps(pageProps)),
    setSearchProps: searchProps => dispatch(setSearchProps(searchProps))
  }
})

export interface PageDispatchersPropType {
  showLoading: (...args: unknown[]) => unknown
  hideLoading: (...args: unknown[]) => unknown
  setPageProps: (...args: unknown[]) => unknown
  setSearchProps: (...args: unknown[]) => unknown
}

interface AnchorLinkProps {
  to?: string
  children?: React.ReactNode
}

export const AnchorLink = ({ to, children }: AnchorLinkProps) => (
  <Link to={to} smooth duration={500} containerId="main-viewport">
    {children}
  </Link>
)

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

interface SubscriptionIconProps {
  subscribedObjectType: string
  subscribedObjectUuid: string
  isSubscribed: boolean
  updatedAt?: number
  refetch: (...args: unknown[]) => unknown
  setError: (...args: unknown[]) => unknown
  persistent?: boolean
}

export const SubscriptionIcon = ({
  subscribedObjectType,
  subscribedObjectUuid,
  isSubscribed,
  updatedAt,
  refetch,
  setError,
  persistent
}: SubscriptionIconProps) => {
  const [disabled, setDisabled] = useState(false)
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
        style={{ background: "none", border: "none", verticalAlign: "middle" }}
        type="button"
        tagName="button"
        disabled={disabled}
        onClick={async () => {
          if (persistent) {
            setDisabled(true)
          }
          await toggleSubscription(
            subscribedObjectType,
            subscribedObjectUuid,
            isSubscribed,
            updatedAt,
            refetch,
            setError
          )
          // TODO: Changing the state of an unmounted component cause warnings. persistent prop can be removed if this changes with react 17
          if (persistent) {
            setDisabled(false)
          }
        }}
      />
    </OverlayTrigger>
  )
}

const toggleSubscription = (
  subscribedObjectType,
  subscribedObjectUuid,
  isSubscribed,
  updatedAt,
  refetch,
  setError
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
  )
    .then(refetch)
    .catch(setError)
}

export const usePageTitle = title => {
  useEffect(() => {
    document.title = title ? `${title} - ANET` : "ANET"
    return () => {
      document.title = "ANET"
    }
  }, [title])
}
