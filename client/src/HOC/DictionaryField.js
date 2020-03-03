import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"

const DictionaryField = WrappedComponent => ({ dictProps, ...otherProps }) => {
  // Only display field if the dictProps are defined
  if (!_isEmpty(dictProps)) {
    return <WrappedComponent {...Object.assign({}, dictProps, otherProps)} />
  } else {
    return null
  }
}
DictionaryField.propTypes = {
  dictProps: PropTypes.object
}

export default DictionaryField
