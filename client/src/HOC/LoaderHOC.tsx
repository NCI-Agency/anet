import _isEmpty from "lodash/isEmpty"
import React from "react"
import { hideLoading, showLoading } from "react-redux-loading-bar"

export const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
})

interface WrapperProps {
  loaderMessage?: string | any
}

const LoaderHOC = isLoadingPropName => dataPropName => WrappedComponent => {
  const Wrapper = ({ loaderMessage, ...otherProps }: WrapperProps) => {
    const dataIsEmpty = _isEmpty(otherProps[dataPropName])
    const showLoader =
      dataIsEmpty && isLoadingData(otherProps[isLoadingPropName])
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
  return Wrapper
}

export default LoaderHOC
