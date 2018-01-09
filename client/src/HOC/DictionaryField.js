import React, { Component } from 'react'
import _isEmpty from 'lodash/isEmpty'

const DictionaryField = (propsArg) => (WrappedComponent) => {
	return class DictionaryField extends Component {
		render() {
			if (!_isEmpty(propsArg)) {
				return <WrappedComponent {...Object.assign({},this.props,propsArg)} />
			} else {
				return null
			}
		}
	}
}

export default DictionaryField
