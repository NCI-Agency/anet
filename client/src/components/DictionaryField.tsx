import _isEmpty from "lodash/isEmpty"
import React from "react"

interface DictionaryFieldProps {
  wrappedComponent?: React.ReactElement
  dictProps?: any
}

const DictionaryField = ({
  wrappedComponent: WrappedComponent,
  dictProps,
  ...otherProps
}: DictionaryFieldProps) => {
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

export default DictionaryField
