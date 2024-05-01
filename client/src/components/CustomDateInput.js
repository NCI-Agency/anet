import { DateInput3, TimePrecision } from "@blueprintjs/datetime2"
import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import CALENDAR_ICON from "resources/calendar.png"
import Settings from "settings"

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
  className,
  disabled,
  showIcon,
  maxDate,
  placement,
  withTime,
  value,
  onChange,
  onBlur,
  canClearSelection
}) => {
  const inputRef = useRef()
  const rightElement = showIcon && CalendarIcon(inputRef.current)
  const width = 8 + (showIcon ? 3 : 0) + (withTime ? 3 : 0)
  const style = { width: `${width}em`, fontSize: "1.1em" }
  const dateFormats = withTime
    ? Settings.dateFormats.forms.input.withTime
    : Settings.dateFormats.forms.input.date
  const inputFormat = dateFormats[0]
  const timePrecision = !withTime ? undefined : TimePrecision.MINUTE
  const timePickerProps = !withTime
    ? undefined
    : {
      selectAllOnFocus: true
      // FIXME: clicking a time arrow immediately closes the dialog;
      // see https://github.com/palantir/blueprint/issues/3474
      // showArrowButtons: true
    }
  return (
    <DateInput3
      inputProps={{
        id,
        style,
        onBlur,
        inputRef: ref => (inputRef.current = ref)
      }}
      className={className}
      rightElement={rightElement}
      value={value && moment(value).toISOString()}
      onChange={onChange}
      formatDate={date => {
        const dt = moment(date)
        return dt.isValid() ? dt.format(inputFormat) : ""
      }}
      parseDate={str => {
        const dt = moment(str, dateFormats, true)
        return dt.isValid() ? dt.toDate() : false
      }}
      placeholder={inputFormat}
      maxDate={maxDate}
      minDate={moment().subtract(100, "years").startOf("year").toDate()}
      canClearSelection={canClearSelection}
      showActionsBar
      closeOnSelection={!withTime}
      timePrecision={timePrecision}
      timePickerProps={timePickerProps}
      showTimezoneSelect={false}
      popoverProps={{ usePortal: false, placement }}
      disabled={disabled}
    />
  )
}
CustomDateInput.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  showIcon: PropTypes.bool,
  maxDate: PropTypes.instanceOf(Date),
  placement: PropTypes.string,
  withTime: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  canClearSelection: PropTypes.bool
}
CustomDateInput.defaultProps = {
  disabled: false,
  showIcon: true,
  maxDate: moment().add(20, "years").endOf("year").toDate(),
  placement: "auto",
  withTime: false,
  canClearSelection: false
}

export default CustomDateInput
