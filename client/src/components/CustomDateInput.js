import "@blueprintjs/core/lib/css/blueprint.css"
import { DateInput, TimePrecision } from "@blueprintjs/datetime"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import { Settings } from "api"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import CALENDAR_ICON from "resources/calendar.png"
import "./BlueprintOverrides.css"

const CalendarIcon = inputRef => (
  <img
    src={CALENDAR_ICON}
    alt=""
    title="Pick a date"
    height={24}
    style={{ verticalAlign: "middle" }}
    onClick={() => {
      if (inputRef && inputRef.focus) {
        inputRef.focus()
      }
    }}
  />
)

const CustomDateInput = ({
  id,
  disabled,
  showIcon,
  withTime,
  value,
  onChange,
  onBlur
}) => {
  const inputRef = useRef()
  const rightElement = showIcon && CalendarIcon(inputRef.current)
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
      inputProps={{
        id,
        style,
        onBlur,
        inputRef: ref => (inputRef.current = ref)
      }}
      rightElement={rightElement}
      value={value && moment(value).toDate()}
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
      popoverProps={{ usePortal: false }}
      disabled={disabled}
    />
  )
}
CustomDateInput.propTypes = {
  id: PropTypes.string,
  disabled: PropTypes.bool,
  showIcon: PropTypes.bool,
  withTime: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func
}
CustomDateInput.defaultProps = {
  disabled: false,
  showIcon: true,
  withTime: false
}

export default CustomDateInput
