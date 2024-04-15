import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"

const DictionaryField = ({
  wrappedComponent: WrappedComponent,
  dictProps,
  ...otherProps
}) => {
  // Only display field if the dictProps are defined
  if (_isEmpty(dictProps) || dictProps?.exclude) {
    return null
  } else {
    return (
      <WrappedComponent
        {...Object.without(
          dictProps,
          "exclude",
          "optional",
          "authorizationGroupUuids"
        )}
        {...otherProps}
      />
    )
  }
}

DictionaryField.propTypes = {
  wrappedComponent: PropTypes.any,
  dictProps: PropTypes.object
}

export default DictionaryField
