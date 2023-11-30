import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"

const DictionaryField = WrappedComponent => {
  const Wrapper = ({ dictProps, ...otherProps }) => {
    // Only display field if the dictProps are defined
    if (_isEmpty(dictProps) || dictProps?.exclude) {
      return null
    } else {
      return (
        <WrappedComponent
          {...Object.without(dictProps, "exclude")}
          {...otherProps}
        />
      )
    }
  }
  Wrapper.propTypes = {
    dictProps: PropTypes.object
  }
  return Wrapper
}

export default DictionaryField
