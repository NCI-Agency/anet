import React, {Component} from 'react'
import PropTypes from 'prop-types'
import autobind from 'autobind-decorator'
import {Report} from 'models'
import _map from 'lodash/map'

const STATE_LABELS = {
	[Report.STATE.DRAFT]: 'Draft',
	[Report.STATE.PENDING_APPROVAL]: 'Pending Approval',
	[Report.STATE.RELEASED]: 'Released',
	[Report.STATE.CANCELLED]: 'Cancelled',
	[Report.STATE.FUTURE]: 'Upcoming Engagement',
}
const CANCELLATION_REASON_LABELS = {
	[Report.CANCELLATION_REASON.CANCELLED_BY_ADVISOR]: 'Advisor',
	[Report.CANCELLATION_REASON.CANCELLED_BY_PRINCIPAL]: 'Principal',
	[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_TRANSPORTATION]: 'Transportation',
	[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_FORCE_PROTECTION]: 'Force Protection',
	[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_ROUTES]: 'Routes',
	[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_THREAT]: 'Threat',
}

export default class ReportStateSearch extends Component {
	static propTypes = {
		//Passed by the SearchFilterDisplay row
		asFormField: PropTypes.bool,
	}

	static defaultProps = {
		asFormField: true
	}

	constructor(props) {
		super(props)

		let value = props.value || {}

		this.state = {
			value: {
				state: value.state || [Report.STATE.DRAFT],
				cancelledReason: value.cancelledReason || "",
			}
		}
	}

	componentDidMount() {
		this.updateFilter()
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.value !== this.props.value) {
			let value = this.props.value
			this.setState({value}, this.updateFilter)
		}
	}

	render() {
		const {value} = this.state
		const labels = value.state.map(s => STATE_LABELS[s])
		const onlyCancelled = value.state.length === 1 && value.state[0] === Report.STATE.CANCELLED
		let stateDisplay = labels.join(" or ")
		if (onlyCancelled && value.cancelledReason) {
			stateDisplay = stateDisplay.concat(" due to ")
			stateDisplay = stateDisplay.concat(CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON[value.cancelledReason]])
		}
		return (
			!this.props.asFormField ?
				stateDisplay
			:
				<div>
					<select value={value.state} onChange={this.changeState} multiple={true}>
						<option value={ Report.STATE.DRAFT }>{ STATE_LABELS[Report.STATE.DRAFT] }</option>
						<option value={ Report.STATE.PENDING_APPROVAL }>{ STATE_LABELS[Report.STATE.PENDING_APPROVAL] }</option>
						<option value={ Report.STATE.RELEASED }>{ STATE_LABELS[Report.STATE.RELEASED] }</option>
						<option value={ Report.STATE.CANCELLED }>{ STATE_LABELS[Report.STATE.CANCELLED] }</option>
						<option value={ Report.STATE.FUTURE }>{ STATE_LABELS[Report.STATE.FUTURE] }</option>
					</select>
					{onlyCancelled && <span style={{verticalAlign: 'top'}}>
						due to <select value={value.cancelledReason} onChange={this.changeCancelledReason}>
							<option value="">Everything</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_BY_ADVISOR }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_BY_ADVISOR] }</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_BY_PRINCIPAL }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_BY_PRINCIPAL] }</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_DUE_TO_TRANSPORTATION }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_TRANSPORTATION] }</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_DUE_TO_FORCE_PROTECTION }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_FORCE_PROTECTION] }</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_DUE_TO_ROUTES }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_ROUTES] }</option>
							<option value={ Report.CANCELLATION_REASON.CANCELLED_DUE_TO_THREAT }>{ CANCELLATION_REASON_LABELS[Report.CANCELLATION_REASON.CANCELLED_DUE_TO_THREAT] }</option>
						</select>
					</span>}
				</div>
		)
	}

	@autobind
	changeState(event) {
		let value = this.state.value
		value.state = _map(event.target.selectedOptions, o => o.value)
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
		const onlyCancelled = value.state.length === 1 && value.state[0] === Report.STATE.CANCELLED
		if (onlyCancelled && value.cancelledReason) {
			query.cancelledReason = value.cancelledReason
		}
		return query
	}

	@autobind
	updateFilter() {
		if (this.props.asFormField) {
			let {value} = this.state
			value.toQuery = this.toQuery
			this.props.onChange(value)
		}
	}
}
