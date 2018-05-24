import PropTypes from 'prop-types'
import React, {Component} from 'react'
import _get from 'lodash/get'
import autobind from 'autobind-decorator'

import NotFound from 'components/NotFound'
import {setMessages} from 'components/Messages'

import API from 'api'

import _isEqual from 'lodash/isEqual'

import { showLoading, hideLoading } from 'react-redux-loading-bar'
import { setPageProps, DEFAULT_PAGE_PROPS } from 'actions'

export const mapDispatchToProps = (dispatch, ownProps) => ({
	showLoading: () => dispatch(showLoading()),
	hideLoading: () => dispatch(hideLoading()),
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default class Page extends Component {

	static propTypes = {
		showLoading: PropTypes.func.isRequired,
		hideLoading: PropTypes.func.isRequired,
		setPageProps: PropTypes.func.isRequired,
	}

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

	componentWillMount() {
		window.scrollTo(0,0)
	}

	loadData(props, context) {
		this.setState({notFound: false, invalidRequest: false})

		if (this.fetchData) {
			document.body.classList.add('loading')
			if (typeof this.props.showLoading === 'function') {
				this.props.showLoading()
			}

			this.fetchData(props || this.props, context || this.context)

			let promise = API.inProgress

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
			let text = modelName ? `${modelName} #${this.props.match.params.id}` : `Page`
			return <NotFound text={`${text} not found.`} />
		} else if (this.state.invalidRequest) {
			return <NotFound text="There was an error processing this request. Please contact an administrator." />
		}

		return this.renderPage()
	}

	componentWillReceiveProps(nextProps, nextContext) {
		// Location always has a new key. In order to check whether the location
		// really changed filter out the key.
		const locationFilterProps = ['key']
		const nextPropsFilteredLocation = Object.without(nextProps.location, ...locationFilterProps)
		const propsFilteredLocation = Object.without(this.props.location, ...locationFilterProps)
		// Filter out React Router props before comparing; for the property names,
		// see https://github.com/ReactTraining/react-router/issues/4424#issuecomment-285809552
		const routerProps = ['match', 'location', 'history']
		const filteredNextProps = Object.without(nextProps, ...routerProps)
		const filteredProps = Object.without(this.props, ...routerProps)
		if (!_isEqual(filteredProps, filteredNextProps)) {
			this.loadData(nextProps, nextContext)
		} else if (!_isEqual(propsFilteredLocation, nextPropsFilteredLocation)) {
			this.loadData(nextProps, nextContext)
		} else if (!_isEqual(this.context, nextContext)) {
			this.loadData(nextProps, nextContext)
		}
	}

	componentDidMount() {
		setMessages(this.props, this.state)
		this.loadData(this.props)
	}
}
