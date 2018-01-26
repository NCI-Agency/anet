import React, { Component } from 'react'
import _isEmpty from 'lodash/isEmpty'

const DictionaryField = (WrappedComponent) => {
	return class DictionaryField extends Component {
		render() {
			const { dictProps, ...otherProps } = this.props
			// Only display field if the dictProps are defined
			if (!_isEmpty(dictProps)) {
				return <WrappedComponent {...Object.assign({}, otherProps, dictProps)} />
			} else {
				return null
			}
		}
	}
}

export default DictionaryField
