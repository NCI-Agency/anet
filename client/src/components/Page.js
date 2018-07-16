import PropTypes from 'prop-types'
import React, {Component} from 'react'
import _get from 'lodash/get'
import autobind from 'autobind-decorator'

import NotFound from 'components/NotFound'
import {setMessages} from 'components/Messages'

import API from 'api'

import _isEqualWith from 'lodash/isEqualWith'

import { showLoading, hideLoading } from 'react-redux-loading-bar'
import { setPageProps, DEFAULT_PAGE_PROPS } from 'actions'

export const mapDispatchToProps = (dispatch, ownProps) => ({
	showLoading: () => dispatch(showLoading()),
	hideLoading: () => dispatch(hideLoading()),
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export const propTypes = {
	showLoading: PropTypes.func.isRequired,
	hideLoading: PropTypes.func.isRequired,
	setPageProps: PropTypes.func.isRequired,
}

export default class Page extends Component {

	constructor(props, pageProps) {
		super(props)
		if (typeof props.setPageProps === 'function') {
			props.setPageProps(pageProps || DEFAULT_PAGE_PROPS)
		}

		this.state = {
			notFound: false,
			invalidRequest: false,
		}

		this.renderPage = this.render
		this.render = Page.prototype.render
	}

	@autobind
	loadData() {
		this.setState({notFound: false, invalidRequest: false})

		if (this.fetchData) {
			document.body.classList.add('loading')
			if (typeof this.props.showLoading === 'function') {
				this.props.showLoading()
			}

			const promise = this.fetchData(this.props)

			if (promise && promise.then instanceof Function) {
				promise.then(this.doneLoading, this.doneLoading)
			} else {
				this.doneLoading()
			}

			return promise
		} else {
			this.doneLoading()
		}
	}

	@autobind
	doneLoading(response) {
		if (typeof this.props.hideLoading === 'function') {
			this.props.hideLoading()
		}
		document.body.classList.remove('loading')

		if (response) {
			if (response.status === 404 || (response.status === 500 && _get(response, ['errors', 0]) === 'Invalid Syntax')) {
				this.setState({notFound: true})
			} else if (response.status === 500) {
				this.setState({invalidRequest: true})
			}
		}

		return response
	}

	render() {
		if (this.state.notFound) {
			let modelName = this.constructor.modelName
			let text = modelName ? `${modelName} #${this.props.match.params.uuid}` : `Page`
			return <NotFound text={`${text} not found.`} />
		} else if (this.state.invalidRequest) {
			return <NotFound text="There was an error processing this request. Please contact an administrator." />
		}

		return this.renderPage()
	}

	@autobind
	equalFunction(value1, value2) {
		if (typeof value1 === 'function' && typeof value2 === 'function') {
			return true
		}
	}

	componentDidUpdate(prevProps, prevState) {
		// Filter out React Router props before comparing; for the property names,
		// see https://github.com/ReactTraining/react-router/issues/4424#issuecomment-285809552
		const propFilter = ['match', 'location', 'history']
		// Also filter out generic pageProps
		propFilter.push('pageProps')
		const filteredNextProps = Object.without(this.props, ...propFilter)
		const filteredProps = Object.without(prevProps, ...propFilter)
		if (!_isEqualWith(filteredProps, filteredNextProps, this.equalFunction)) {
			this.loadData()
		} else {
			// Location always has a new key. In order to check whether the location
			// really changed filter out the key.
			const locationFilterProps = ['key']
			const nextPropsFilteredLocation = Object.without(this.props.location, ...locationFilterProps)
			const propsFilteredLocation = Object.without(prevProps.location, ...locationFilterProps)
			if (!_isEqualWith(propsFilteredLocation, nextPropsFilteredLocation, this.equalFunction)) {
				this.loadData()
			}
		}
	}

	componentDidMount() {
		window.scrollTo(0,0)
		setMessages(this.props, this.state)
		this.loadData()
	}
}

Page.propTypes = propTypes
