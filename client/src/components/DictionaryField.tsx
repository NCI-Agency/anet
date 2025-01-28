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
  hideIfEmpty = false,
  ...otherProps
}: DictionaryFieldProps) => {
  // Only display field if the dictProps are defined
  if (_isEmpty(dictProps) || dictProps?.exclude) {
    return null
  }
  if (
    hideIfEmpty &&
    (otherProps.content === "" ||
      otherProps.content == null ||
      (otherProps.content instanceof Object &&
        !Object.keys(otherProps.content).length))
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
