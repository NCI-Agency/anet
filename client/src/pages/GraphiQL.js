import PropTypes from 'prop-types'

import React from 'react'
import Page, {mapDispatchToProps} from 'components/Page'

import Breadcrumbs from 'components/Breadcrumbs'

import { PAGE_PROPS_NO_NAV } from 'actions'
import { connect } from 'react-redux'

var GraphiQLreq = null/* required later */

class GraphiQL extends Page {

	static propTypes = Object.assign({}, Page.propTypes)

	constructor(props) {
		super(props, PAGE_PROPS_NO_NAV)
	}

	componentDidMount() {
		if (GraphiQLreq)
			return

		require.ensure([], () => {
			GraphiQLreq = require('graphiql')
			require('graphiql/graphiql.css')
			this.forceUpdate()
		})
	}

	fetch(params) {
		return fetch('/graphql', {
			credentials: 'same-origin',
			method: 'POST',
			headers: {'Content-Type': 'application/json', Accept: 'application/json'},
			body: JSON.stringify(params),
		}).then(response => response.json())
	}

	render() {
		return <div>
			<Breadcrumbs items={[['Run GraphQL queries', '/graphiql']]} />
			{GraphiQLreq ? <GraphiQLreq fetcher={this.fetch} /> : 'Loading...'}
		</div>
	}
}

export default connect(null, mapDispatchToProps)(GraphiQL)
