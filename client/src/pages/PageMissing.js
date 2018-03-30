import PropTypes from 'prop-types'
import React from 'react'
import Page from 'components/Page'
import NotFound from 'components/NotFound'

import { setPageProps, PAGE_PROPS_FLUID } from 'actions'
import { connect } from 'react-redux'

class PageMissing extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_FLUID)
	}

	render() {
		return <NotFound text={`Page ${this.props.match.params[0]} not found`} />
	}
}

const mapDispatchToProps = (dispatch, ownProps) => ({
	setPageProps: pageProps => dispatch(setPageProps(pageProps))
})

export default connect(null, mapDispatchToProps)(PageMissing)
