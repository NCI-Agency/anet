import React, { Component } from 'react'
import PropTypes from 'prop-types'

import API from 'api'

class FutureEngagementInsights extends Component {
	static propTypes = {
		date: PropTypes.object,
	}

	constructor(props) {
		super(props)
	
		this.state = {
			date: props.date
		}
	}

	fetchData() {

	}

	render() {
		return(<div><h2>Future Engagements</h2></div>)
	}
}

export default FutureEngagementInsights
