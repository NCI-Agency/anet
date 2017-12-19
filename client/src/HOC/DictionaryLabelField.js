import React, { Component } from 'react'
import PropTypes from 'prop-types'

const DictionaryLabelField = (label) => (WrappedComponent) => {
	return class DictionaryLabelField extends Component {
		static propTypes = {
			labelKey: PropTypes.string,
		}
		isNotEmpty(prop) {
			return (
				prop !== null &&
				prop !== undefined &&
				(prop.hasOwnProperty('length') && prop.length > 0)
			)
		}
		render() {
			if (this.isNotEmpty(label)) {
				return <WrappedComponent {...this.props} label={label} />
			} else {
				return null
			}
		}
	}
}

export default DictionaryLabelField
