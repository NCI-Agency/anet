import "@blueprintjs/core/lib/css/blueprint.css"
import { DateInput, TimePicker, TimePrecision } from "@blueprintjs/datetime"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import { Settings } from "api"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
import CALENDAR_ICON from "resources/calendar.png"
import "./BlueprintOverrides.css"

const CalendarIcon = id => (
  <img
    src={CALENDAR_ICON}
    alt=""
    title="Pick a date"
    height={24}
    style={{ verticalAlign: "middle" }}
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
    withTime: PropTypes.bool,
    value: PropTypes.object,
    onChange: PropTypes.func,
    onBlur: PropTypes.func
  }

  static defaultProps = {
    showIcon: true,
    withTime: false
  }

  render() {
    const { id, showIcon, withTime, value, onChange, onBlur } = this.props
    const rightElement = showIcon && CalendarIcon(id)
    const width = 8 + (showIcon ? 3 : 0) + (withTime ? 3 : 0)
    const style = { width: `${width}em`, fontSize: "1.1em" }
    const dateFormats = withTime
      ? Settings.dateFormats.forms.input.withTime
      : Settings.dateFormats.forms.input.date
    const inputFormat = dateFormats[0]
    const timePickerProps = !withTime
      ? {}
      : {
        precision: TimePrecision.MINUTE,
        selectAllOnFocus: true
        // FIXME: clicking a time arrow immediately closes the dialog;
	// see https://github.com/palantir/blueprint/issues/3474
        // showArrowButtons: true
      }
    return (
      <DateInput
        inputProps={{ id, style, onBlur }}
        rightElement={rightElement}
        value={value}
        onChange={onChange}
        formatDate={date => moment(date).format(inputFormat)}
        parseDate={str => moment(str, dateFormats, true).toDate()}
        placeholder={inputFormat}
        maxDate={moment()
          .add(20, "years")
          .endOf("year")
          .toDate()}
        canClearSelection={false}
        showActionsBar
        closeOnSelection={!withTime}
        timePickerProps={timePickerProps}
      />
    )
  }
}
