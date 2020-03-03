import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { hideLoading, showLoading } from "react-redux-loading-bar"

export const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
})

const LoaderHOC = isLoadingPropName => dataPropName => WrappedComponent => ({
  loaderMessage,
  ...otherProps
}) => {
  const dataIsEmpty = _isEmpty(otherProps[dataPropName])
  const showLoader = dataIsEmpty && isLoadingData(otherProps[isLoadingPropName])
  const defaultMessage = (
    <div>
      <em>No data</em>
    </div>
  )

  if (showLoader) {
    return <div className="loader" />
  } else if (dataIsEmpty) {
    return _isEmpty(loaderMessage) ? defaultMessage : loaderMessage
  } else {
    return <WrappedComponent {...otherProps} />
  }

  function isLoadingData(prop) {
    return prop || prop === undefined
  }
}
LoaderHOC.propTypes = {
  loaderMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

export default LoaderHOC
