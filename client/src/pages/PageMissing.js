import React from 'react'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import NotFound from 'components/NotFound'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

class PageMissing extends Page {

	static propTypes = {...pagePropTypes}

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	render() {
		return <NotFound text={`Page ${this.props.match.params[0]} not found`} />
	}
}

export default connect(null, mapDispatchToProps)(PageMissing)
