import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _isEmpty from 'lodash/isEmpty'

const DictionaryField = (propsArg) => (WrappedComponent) => {
	return class DictionaryField extends Component {
		static propTypes = {
			labelKey: PropTypes.string,
		}
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
