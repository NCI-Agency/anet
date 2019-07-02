import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { Component } from "react"

const DictionaryField = WrappedComponent => {
  return class DictionaryField extends Component {
    static propTypes = {
      dictProps: PropTypes.object
    }

    render() {
      const { dictProps, ...otherProps } = this.props
      // Only display field if the dictProps are defined
      if (!_isEmpty(dictProps)) {
        return (
          <WrappedComponent {...Object.assign({}, otherProps, dictProps)} />
        )
      } else {
        return null
      }
    }
  }
}

export default DictionaryField
