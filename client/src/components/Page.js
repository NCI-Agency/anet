import { setPageProps, setPagination, setSearchProps } from "actions"
import NotFound from "components/NotFound"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import { animateScroll, Link } from "react-scroll"

export const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading()),
  setPageProps: pageProps => dispatch(setPageProps(pageProps)),
  setSearchProps: searchProps => dispatch(setSearchProps(searchProps)),
  setPagination: (pageKey, pageNum) => dispatch(setPagination(pageKey, pageNum))
})

export const propTypes = {
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
  setPageProps: PropTypes.func.isRequired,
  setSearchProps: PropTypes.func.isRequired,
  searchQuery: PropTypes.shape({
    text: PropTypes.string,
    filters: PropTypes.any,
    objectType: PropTypes.string
  })
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

export const useBoilerplate = props => {
  useEffect(
    () => {
      applyPageProps(props.setPageProps, props.pageProps)
      applySearchProps(props.setSearchProps, props.searchProps)
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )
  useEffect(
    () => {
      toggleLoading(props.loading, props.showLoading, props.hideLoading)
      return function cleanup() {
        // Make sure loading indicator is hidden when 'unmounting'
        toggleLoading(false, props.showLoading, props.hideLoading)
      }
    },
    [props.loading] // eslint-disable-line react-hooks/exhaustive-deps
  )
  if (props.loading) {
    return { done: true, result: <div className="loader" /> }
  }
  if (props.error) {
    return {
      done: true,
      result: renderError(props.error, props.modelName, props.uuid)
    }
  }
  return { done: false }
}

export const renderError = (error, modelName, uuid) => {
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

export const toggleLoading = (loading, showLoading, hideLoading) => {
  if (loading) {
    if (typeof showLoading === "function") {
      showLoading()
    }
  } else {
    if (typeof hideLoading === "function") {
      hideLoading()
    }
  }
}

export const applyPageProps = (setPageProps, pageProps) => {
  if (pageProps && typeof setPageProps === "function") {
    setPageProps(Object.assign({}, pageProps))
  }
}

export const applySearchProps = (setSearchProps, searchProps) => {
  if (searchProps && typeof setSearchProps === "function") {
    setSearchProps(Object.assign({}, searchProps))
  }
}

export const getSearchQuery = searchQuery => {
  let query = {}
  if (!_isEmpty(searchQuery.text)) {
    query.text = searchQuery.text
  }
  if (searchQuery.filters) {
    searchQuery.filters.forEach(filter => {
      if (filter.value) {
        if (filter.value.toQuery) {
          Object.assign(query, filter.value.toQuery)
        } else {
          query[filter.key] = filter.value
        }
      }
    })
  }
  return query
}

export const usePrevious = value => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
