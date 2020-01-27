import { setPageProps, setSearchProps } from "actions"
import NotFound from "components/NotFound"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import { animateScroll, Link } from "react-scroll"

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
