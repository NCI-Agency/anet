import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import decodeQuery from 'querystring/decode'
import utils from 'utils'
import _isEmpty from 'lodash/isEmpty'

import * as Models from 'models'

const MODEL_NAMES = Object.keys(Models).map(key => {
	let camel = utils.camelCase(key)
	if (camel === 'location') {
		camel = 'anetLocation'
	}
	Models[camel] = Models[key]
	return camel
})

const modelPropTypes = MODEL_NAMES.reduce((map, name) => ({
	...map,
	[name]: PropTypes.oneOfType([
		PropTypes.instanceOf(Models[name]),
		PropTypes.object,
		PropTypes.string,
	])
}), {})

export default class LinkTo extends Component {
	static propTypes = {
		componentClass: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.func,
		]),

		edit: PropTypes.bool,

		// Configures this link to look like a button. Set it to true to make it a button,
		// or pass a string to set a button type
		button: PropTypes.oneOfType([
			PropTypes.bool,
			PropTypes.string,
		]),

		target: PropTypes.string,
		...modelPropTypes,
	}

	static defaultProps = {
		isLink: true,
		whenUnspecified: "Unspecified"
	}

	render() {
		let {componentClass, children, edit, button, isLink, whenUnspecified, className, ...componentProps} = this.props

		if (button) {
			componentProps.className = [className, 'btn', `btn-${button === true ? 'default' : button}`].join(' ')
		} else {
			componentProps.className = className
		}
		let modelName = Object.keys(componentProps).find(key => MODEL_NAMES.indexOf(key) !== -1)
		if (!modelName) {
			console.error('You called LinkTo without passing a Model as a prop')
			return null
		}

		let modelInstance = this.props[modelName]
		if (_isEmpty(modelInstance))
			return <span>{whenUnspecified}</span>

		let modelClass = Models[modelName]

		if (!isLink)
			return <span> {modelClass.prototype.toString.call(modelInstance)} </span>

		let to = modelInstance
		if (typeof to === 'string') {
			if (to.indexOf('?')) {
				let components = to.split('?')
				to = {pathname: components[0], search: components[1]}
			}
		} else {
			to = edit ? modelClass.pathForEdit(modelInstance) : modelClass.pathFor(modelInstance)
		}

		componentProps = Object.without(componentProps, modelName)

		let Component = componentClass || Link
		return <Component to={to} {...componentProps}>
			{children || modelClass.prototype.toString.call(modelInstance)}
		</Component>
	}
}
