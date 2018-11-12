import PropTypes from 'prop-types'
import React, {Component} from 'react'
import _get from 'lodash/get'
import autobind from 'autobind-decorator'

import NotFound from 'components/NotFound'
import {setMessages} from 'components/Messages'

import API from 'api'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'

import { showLoading, hideLoading } from 'react-redux-loading-bar'
import { animateScroll, Link } from 'react-scroll'
import { setPageProps, setSearchProps, setSearchQuery, clearSearchQuery, DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS} from 'actions'

export const mapDispatchToProps = (dispatch, ownProps) => ({
	showLoading: () => dispatch(showLoading()),
	hideLoading: () => dispatch(hideLoading()),
	setPageProps: pageProps => dispatch(setPageProps(pageProps)),
	setSearchProps: searchProps => dispatch(setSearchProps(searchProps)),
	setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
	clearSearchQuery: () => dispatch(clearSearchQuery()),
})

export const propTypes = {
	showLoading: PropTypes.func.isRequired,
	hideLoading: PropTypes.func.isRequired,
	setPageProps: PropTypes.func.isRequired,
	setSearchProps: PropTypes.func.isRequired,
	setSearchQuery: PropTypes.func.isRequired,
	onSearchGoToSearchPage: PropTypes.bool,
	searchQuery: PropTypes.shape({
		text: PropTypes.string,
		filters: PropTypes.any,
		objectType: PropTypes.string
	}),
	clearSearchQuery: PropTypes.func.isRequired,
}

export const AnchorLink = function(props) {
	const {to, ...remainingProps} = props
	return <Link to={to} smooth={true} duration={500} containerId="main-viewport" {...remainingProps}>{props.children}</Link>
}


export function jumpToTop() {
	animateScroll.scrollToTop({
		duration: 500,
		delay: 100,
		smooth: "easeInOutQuint",
		containerId: "main-viewport"})
	}

export default class Page extends Component {

	constructor(props, pageProps, searchProps) {
		super(props)
		const pp = pageProps || DEFAULT_PAGE_PROPS
		const sp = searchProps || DEFAULT_SEARCH_PROPS
		if (typeof props.setPageProps === 'function') {
			props.setPageProps(Object.assign({}, pp))
		}
		if (typeof props.setSearchProps === 'function') {
			props.setSearchProps(Object.assign({}, sp))
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

	componentDidUpdate(prevProps, prevState) {
		// Filter out React Router props before comparing; for the property names,
		// see https://github.com/ReactTraining/react-router/issues/4424#issuecomment-285809552
		const propFilter = ['match', 'location', 'history']
		// Also filter out generic pageProps
		propFilter.push('pageProps')
		const filteredNextProps = Object.without(this.props, ...propFilter)
		const filteredProps = Object.without(prevProps, ...propFilter)
		if (!_isEqualWith(filteredProps, filteredNextProps, utils.treatFunctionsAsEqual)) {
			this.loadData()
		} else {
			// Location always has a new key. In order to check whether the location
			// really changed filter out the key.
			// When location has a changed has we do not need to reload the data.
			// We do not make use of the location state, therefore we ignore it for now
			// as otherwise a change from no state to empty state would result in
			// reloading the data and we do not want that.
			const locationFilterProps = ['key', 'hash', 'state']
			const nextPropsFilteredLocation = Object.without(this.props.location, ...locationFilterProps)
			const propsFilteredLocation = Object.without(prevProps.location, ...locationFilterProps)
			if (!_isEqualWith(propsFilteredLocation, nextPropsFilteredLocation, utils.treatFunctionsAsEqual)) {
				this.loadData()
			}
		}
	}

	componentDidMount() {
		setMessages(this.props, this.state)
		this.loadData()
	}

	@autobind
	getSearchQuery(props) {
		let {searchQuery} = props || this.props
		let query = {text: searchQuery.text}
		if (searchQuery.filters) {
			searchQuery.filters.forEach(filter => {
				if (filter.value) {
					if (filter.value.toQuery) {
						const toQuery = typeof filter.value.toQuery === 'function'
							? filter.value.toQuery()
							: filter.value.toQuery
						Object.assign(query, toQuery)
					} else {
						query[filter.key] = filter.value
					}
				}
			})
		}
		console.log('SEARCH advanced query', query)

		return query
	}

}

Page.propTypes = propTypes
