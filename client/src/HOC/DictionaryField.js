import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"

const DictionaryField = WrappedComponent => {
  const Wrapper = ({ dictProps, ...otherProps }) => {
    // Only display field if the dictProps are defined
    if (_isEmpty(dictProps)) {
      return null
    } else {
      return <WrappedComponent {...Object.assign({}, dictProps, otherProps)} />
    }
  }
  Wrapper.propTypes = {
    dictProps: PropTypes.object
  }
  return Wrapper
}

export default DictionaryField
