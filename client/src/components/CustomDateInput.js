import PropTypes from 'prop-types'
import React, { Component } from 'react'

import {Settings} from 'api'
import moment from 'moment'

import { DateInput } from '@blueprintjs/datetime'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import './BlueprintOverrides.css'
import CALENDAR_ICON from 'resources/calendar.png'

const CalendarIcon = (id) => (
	<img
		src={CALENDAR_ICON}
		alt=""
		title="Pick a date"
		height={24}
		style={{verticalAlign: 'middle'}}
		onClick={() => {
			const element = document.getElementById(id)
			if (element && element.focus) {
				element.focus()
			}
		}}
	/>
)

export default class CustomDateInput extends Component {
	static propTypes = {
		id: PropTypes.string,
		showIcon: PropTypes.bool,
		value: PropTypes.object,
		onChange: PropTypes.func,
		onBlur: PropTypes.func,
	}

	static defaultProps = {
		showIcon: true,
	}

	render() {
		const { id, showIcon, value, onChange, onBlur } = this.props
		const rightElement = showIcon && CalendarIcon(id)
		const style = { width: showIcon ? '11em' : '8em', fontSize: '1.1em' }
		const inputFormat = Settings.dateFormats.forms.input[0]
		return (
			<DateInput
				inputProps={{ id, style, onBlur }}
				rightElement={rightElement}
				value={value}
				onChange={onChange}
				formatDate={date => moment(date).format(inputFormat)}
				parseDate={str => moment(str, Settings.dateFormats.forms.input, true).toDate()}
				placeholder={inputFormat}
				maxDate={moment().add(20, 'years').endOf('year').toDate()}
				canClearSelection={false}
				showActionsBar={true}
			/>
		)
	}
}
