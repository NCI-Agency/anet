import React, {Component, PropTypes} from 'react'
import autobind from 'autobind-decorator'

import ReportCollection from 'components/ReportCollection'

import API from 'api'

export default class SavedSearchTable extends Component {
	static propTypes = {
		search: PropTypes.any.isRequired,
	}

	constructor(props) {
		super(props)

		this.state = {
			reports: []
		}

		if (props.search) {
			this.runSearch(props.search)
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.search && (nextProps.search.id !== this.props.search.id)) {
			this.runSearch(nextProps.search)
		}
	}

	@autobind
	runSearch(search) {
		let query = JSON.parse(search.query)
		let fields = ReportCollection.GQL_REPORT_FIELDS
		API.query(/*GraphQL */`
			reports: reportList(f:search, query: $query) {
				pageNum, pageSize, totalCount, list {
					${fields}
				}
			}
		`, {query}, '($query: ReportSearchQuery)').then(data =>
			this.setState({reports: data.reports})
		)
	}

	render() {
		return <ReportCollection reports={this.state.reports.list} />
	}

}
