import React from 'react'
import {Button} from 'react-bootstrap'
import DatePicker from 'react-16-bootstrap-date-picker'

import CALENDAR_ICON from 'resources/calendar.png'

export default (props) => 
	<DatePicker
		showTodayButton
		showClearButton={false}
		style={{}}
		customControl = {<Button><img src={CALENDAR_ICON} height={20} alt="Pick a date" /></Button>}
		{...props}
	/> 
