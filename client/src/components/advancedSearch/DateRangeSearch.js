import React, {Component} from 'react'
import autobind from 'autobind-decorator'

import DatePicker from 'react-bootstrap-date-picker'
import {Row, Col} from 'react-bootstrap'
import moment from 'moment'

const LAST_DAY = -1 * 1000 * 60 * 60 * 24
const LAST_WEEK = LAST_DAY * 7
const LAST_MONTH = LAST_DAY * 30

export default class DateRangeSearch extends Component {

	constructor(props) {
		super(props)

		let {value} = props

		this.state = {
			value: {
				relative: "0",
				start: value.start ? value.start : null,
				end: value.end ? value.end : null,
			}
		}

		this.updateFilter()
	}

	render() {
		let {value} = this.state
		return <div style={this.props.style}>
			<Row>
			<Col md={3}>
				<select value={value.relative} onChange={this.onChangeRelative} >
					<option value={0} >Between</option>
					<option value={LAST_DAY} >Last 24 hours</option>
					<option value={LAST_WEEK} >Last 7 days</option>
					<option value={LAST_MONTH} >Last 30 days</option>
				</select>
			</Col>
			{value.relative === "0" &&
				<Col md={4}>
					<DatePicker value={value.start} onChange={this.onChangeStart} showTodayButton showClearButton={false} />
				</Col>
			}
			{value.relative === "0" &&
				<Col md={1} style={{paddingTop:'5px', paddingLeft:'9px'}}>
					and
				</Col>
			}

			{value.relative === "0" &&
				<Col md={4}>
					<DatePicker value={value.end} onChange={this.onChangeEnd} showTodayButton showClearButton={false} />
				</Col>
			}
			</Row>
		</div>
	}

	@autobind
	onChangeStart(newDate) {
		let {value} = this.state
		value.start = newDate
		this.setState({value}, this.updateFilter)
	}

	@autobind
	onChangeEnd(newDate) {
		let {value} = this.state
		value.end = newDate
		this.setState({value}, this.updateFilter)
	}

	@autobind
	onChangeRelative(newValue) {
		let {value} = this.state
		value.relative = newValue.target.value
		this.setState({value}, this.updateFilter)
	}

	@autobind
	toQuery() {
		let {queryKey} = this.props
		let {value} = this.state
		let startKey = queryKey ? queryKey + 'Start' : 'start'
		let endKey = queryKey ? queryKey + 'End' : 'end'

		if (value.relative !== "0") {
			//time relative to now.
			return {
				[startKey]: value.relative
			}
		} else {
			//Between start and end date
			return {
				[startKey]: moment(value.start).valueOf(),
				[endKey]: moment(value.end).valueOf(),
			}
		}
	}

	@autobind
	updateFilter() {
		let value = this.state.value
		value.toQuery = this.toQuery
		this.props.onChange(value)
	}
}
