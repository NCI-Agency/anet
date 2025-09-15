import _isEmpty from "lodash/isEmpty"
import React from "react"

interface DictionaryFieldProps {
  wrappedComponent?: React.ReactElement
  dictProps?: any
  hideIfEmpty?: boolean
}

const DictionaryField = ({
  wrappedComponent: WrappedComponent,
  dictProps,
  hideIfEmpty,
  ...otherProps
}: DictionaryFieldProps) => {
  // Only display field if the dictProps are defined
  if (_isEmpty(dictProps) || dictProps?.exclude) {
    return null
  }
  if (
    hideIfEmpty &&
    _isEmpty(otherProps.content) &&
    _isEmpty(otherProps?.field?.value) &&
    _isEmpty(otherProps?.humanValue)
  ) {
    return null
  }
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

export default DictionaryField
