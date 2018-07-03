import React, {Component} from 'react'
import {Button} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'
import autobind from 'autobind-decorator'

import CALENDAR_ICON from 'resources/calendar.png'

const inputCss = {
	visibility: 'hidden',
	display: 'inline',
	width: 0,
	height: 0,
	border: 'none',
	padding: 0,
}

export default class CalendarButton extends Component {
	render() {
		let {onChange, value, ...props} = this.props

		return <Button onClick={this.onClick} onBlur={this.onBlur} {...props}>
			<img src={CALENDAR_ICON} height={20} alt="Pick a date" />

			<DatePicker
				ref="datePicker"
				value={value}
				style={inputCss}
				showTodayButton
				showClearButton={false}
				onChange={onChange}
				calendarContainer={document.body}
			/>
		</Button>
	}

	@autobind
	onClick() {
		let datePicker = this.refs.datePicker
		if (datePicker.state.inputFocused) {
			datePicker.handleBlur()
		} else {
			datePicker.handleFocus()
		}
	}

	@autobind
	onBlur() {
		this.refs.datePicker.handleBlur()
	}
}
