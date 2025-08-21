import _isEmpty from "lodash/isEmpty"
import React from "react"

interface WrapperProps {
  loaderMessage?: string | React.ComponentType<unknown>
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
