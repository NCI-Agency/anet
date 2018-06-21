import React, {Component} from 'react'
import autobind from 'autobind-decorator'
import {Report} from 'models'

export default class ReportStateSearch extends Component {
	constructor(props) {
		super(props)

		let value = props.value || {}

		this.state = {
			value: {
				state: value.state || Report.STATE.DRAFT,
				cancelledReason: value.cancelledReason || "",
			}
		}
	}

	componentDidMount() {
		this.updateFilter()
	}

	componentDidUpdate() {
		this.updateFilter()
	}

	render() {
		let {value} = this.state

		return <div>
			<select value={value.state} onChange={this.changeState}>
				<option value={ Report.STATE.DRAFT }>Draft</option>
				<option value={ Report.STATE.PENDING_APPROVAL }>Pending Approval</option>
				<option value={ Report.STATE.RELEASED }>Released</option>
				<option value={ Report.STATE.CANCELLED }>Cancelled</option>
				<option value={ Report.STATE.FUTURE }>Upcoming Engagement</option>
			</select>

			{value.state === Report.STATE.CANCELLED && <span>
				due to <select value={value.cancelledReason} onChange={this.changeCancelledReason}>
					<option value="">Everything</option>
					<option value="CANCELLED_BY_ADVISOR">Advisor</option>
					<option value="CANCELLED_BY_PRINCIPAL">Principal</option>
					<option value="CANCELLED_DUE_TO_TRANSPORTATION">Transportation</option>
					<option value="CANCELLED_DUE_TO_FORCE_PROTECTION">Force Protection</option>
					<option value="CANCELLED_DUE_TO_ROUTES">Routes</option>
					<option value="CANCELLED_DUE_TO_THREAT">Threat</option>
				</select>
			</span>}
		</div>
	}

	@autobind
	changeState(event) {
		let value = this.state.value
		value.state = event.target.value
		this.setState({value}, this.updateFilter)
	}

	@autobind
	changeCancelledReason(event) {
		let value = this.state.value
		value.cancelledReason = event.target.value
		this.setState({value}, this.updateFilter)
	}

	@autobind
	toQuery() {
		let value = this.state.value
		let query = {state: value.state}
		if (value.cancelledReason) { query.cancelledReason = value.cancelledReason }
		return query
	}

	@autobind
	updateFilter() {
		let value = this.state.value
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}
}
