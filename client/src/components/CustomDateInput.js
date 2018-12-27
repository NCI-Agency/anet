import PropTypes from 'prop-types'
import React, { Component } from 'react'

import Settings from 'Settings'
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
		height={30}
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
		dateFormat: PropTypes.string,
		showIcon: PropTypes.bool,
		showValueLeft: PropTypes.bool,
		value: PropTypes.object,
		onChange: PropTypes.func,
	}

	static defaultProps = {
		dateFormat: Settings.dateFormats.forms.short,
		showIcon: true,
		showValueLeft: false,
	}

	render() {
		const { id, showIcon, showValueLeft, value } = this.props
		const rightElement = showIcon && CalendarIcon(id)
		const style = { width: showIcon ? '10em' : '8em' }
		const flexDirection = showValueLeft ? 'row' : 'column-reverse'
		const inputFormat = Settings.dateFormats.forms.input
		return (
			<div style={{
				display: 'flex',
				flexDirection,
			}}>
				<span style={{marginLeft: 5, marginRight: 5}}>{value && moment(value).format(this.props.dateFormat)}</span>
				<DateInput
					inputProps={{ id, style }}
					rightElement={rightElement}
					value={value}
					onChange={this.props.onChange}
					formatDate={date => moment(date).format(inputFormat)}
					parseDate={str => moment(str, inputFormat).toDate()}
					placeholder={inputFormat}
					maxDate={moment().add(20, 'years').endOf('year').toDate()}
					canClearSelection={false}
					showActionsBar={true}
				/>
			</div>
		)
	}
}
