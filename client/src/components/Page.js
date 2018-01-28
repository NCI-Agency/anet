import React, {Component} from 'react'
import _get from 'lodash/get'
import autobind from 'autobind-decorator'

import NotFound from 'components/NotFound'
import {setMessages} from 'components/Messages'

import API from 'api'

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const NPROGRESS_CONTAINER = '.header'

if (process.env.NODE_ENV !== 'test') {
	NProgress.configure({
		parent: NPROGRESS_CONTAINER
	})
}

export default class Page extends Component {
	constructor() {
		super()

		this.state = {
			notFound: false,
			invalidRequest: false,
		}

		this.renderPage = this.render
		this.render = Page.prototype.render
	}

	componentWillMount() {
		window.scrollTo(0,0)

		if (document.querySelector(NPROGRESS_CONTAINER)) {
			NProgress.start()
		}
	}

	loadData(props, context) {
		this.setState({notFound: false, invalidRequest: false})

		if (this.fetchData) {
			document.body.classList.add('loading')

			this.fetchData(props || this.props, context || this.context)

			let promise = API.inProgress

			if (promise && promise.then instanceof Function) {
				NProgress.set(0.5)
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
		NProgress.done()
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
			let text = modelName ? `${modelName} #${this.props.params.id}` : `Page`
			return <NotFound text={`${text} not found.`} />
		} else if (this.state.invalidRequest) {
			return <NotFound text="There was an error processing this request. Please contact an administrator." />
		}

		return this.renderPage()
	}

	componentWillReceiveProps(nextProps, nextContext) {
		if (nextProps !== this.props) {
			this.loadData(nextProps, nextContext)
		} else if (this.context && (this.context !== nextContext)) {
			this.loadData(nextProps, nextContext)
		}
	}

	componentDidMount() {
		setMessages(this.props, this.state)
		this.loadData(this.props)
	}
}
