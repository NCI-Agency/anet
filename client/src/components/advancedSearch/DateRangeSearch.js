import React, {Component} from 'react'
import PropTypes from 'prop-types'
import autobind from 'autobind-decorator'

import DatePicker from 'react-16-bootstrap-date-picker'
import {Row, Col} from 'react-bootstrap'
import moment from 'moment'
import _uniqueId from 'lodash/uniqueId'

const LAST_DAY = -1 * 1000 * 60 * 60 * 24
const LAST_WEEK = LAST_DAY * 7
const LAST_MONTH = LAST_DAY * 30

const dateRangeValue = PropTypes.shape({
	relative: PropTypes.string,
	start: PropTypes.string,
	end: PropTypes.string
})

export default class DateRangeSearch extends Component {
	static propTypes = {
		onlyBetween: PropTypes.bool,
		value: PropTypes.oneOfType([
			dateRangeValue,
			PropTypes.string
		])
	}

	static defaultProps = {
		onlyBetween: false
	}

	constructor(props) {
		super(props)

		let {value} = props

		this.state = {
			value: {
				relative: value.relative || "0",
				start: value.start || null,
				end: value.end || null,
			},
			ids: {
				between: _uniqueId('dateRange_'),
				last_day: _uniqueId('dateRange_'),
				last_week: _uniqueId('dateRange_'),
				last_month: _uniqueId('dateRange_'),
			}
		}

		this.updateFilter()
	}

	selectMenu = (onlyBetween) => {
		const betweenOption = <option key={ this.state.ids.between } value={0} >Between</option>
		const remainingOptions =
			[
				<option key={ this.state.ids.last_day } value={LAST_DAY} >Last 24 hours</option>,
				<option key={ this.state.ids.last_week } value={LAST_WEEK} >Last 7 days</option>,
				<option key={ this.state.ids.last_month } value={LAST_MONTH} >Last 30 days</option>
			]
		const options = (onlyBetween) ? betweenOption : [betweenOption, ...remainingOptions]

		return(
			<select
				disabled={onlyBetween}
				value={this.state.value.relative}
				onChange={this.onChangeRelative}>{options}</select>
		)
	}

	render() {
		let {value} = this.state
		return <div style={this.props.style}>
			<Row>
			<Col md={3}>
				{this.selectMenu(this.props.onlyBetween)}
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

	static getDerivedStateFromProps(props, state) {
		if (props.value && props.value !== state.value) {
			return {value: props.value}
		}
		return null
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
