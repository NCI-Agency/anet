import { Placement } from "@blueprintjs/core"
import { TimePrecision } from "@blueprintjs/datetime"
import { DateInput3, DatePickerShortcut } from "@blueprintjs/datetime2"
import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css"
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css"
import moment from "moment"
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

interface CustomDateInputProps {
  id?: string
  className?: string
  disabled?: boolean
  showIcon?: boolean
  maxDate?: Date
  minDate?: Date
  initialMonth?: Date
  placement?: Placement
  withTime?: boolean
  value?: string | number | Date
  shortcuts?: boolean | DatePickerShortcut[]
  onChange?: (...args: unknown[]) => unknown
  onBlur?: (...args: unknown[]) => unknown
  canClearSelection?: boolean
}

const CustomDateInput = ({
  id,
  className,
  disabled = false,
  showIcon = true,
  maxDate = moment().add(20, "years").endOf("year").toDate(),
  minDate = moment().subtract(100, "years").startOf("year").toDate(),
  initialMonth,
  placement = "auto",
  withTime = false,
  value,
  shortcuts,
  onChange,
  onBlur,
  canClearSelection = false
}: CustomDateInputProps) => {
  const inputRef = useRef()
  const rightElement = showIcon && CalendarIcon(inputRef.current)
  const width = 8 + (showIcon ? 3 : 0) + (withTime ? 3 : 0)
  const style = { width: `${width}em`, fontSize: "1.1em" }
  const dateFormats = withTime
    ? Settings.dateFormats.forms.input.withTime
    : Settings.dateFormats.forms.input.date
  const inputFormat = dateFormats[0]
  const dayPickerProps = {
    weekStartsOn: Settings.useISO8601 ? 1 : 0,
    firstWeekContainsDate: Settings.useISO8601 ? 4 : 1
  }
  const timePrecision = !withTime ? undefined : TimePrecision.MINUTE
  const timePickerProps = !withTime
    ? undefined
    : {
      selectAllOnFocus: true
      // FIXME: clicking a time arrow immediately closes the dialog;
      // see https://github.com/palantir/blueprint/issues/3474
      // showArrowButtons: true
    }
  const inputValue = value ? moment(value).toISOString() : null
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
      value={inputValue}
      initialMonth={initialMonth}
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
      minDate={minDate}
      canClearSelection={canClearSelection}
      showActionsBar
      closeOnSelection={!withTime}
      dayPickerProps={dayPickerProps}
      timePrecision={timePrecision}
      timePickerProps={timePickerProps}
      showTimezoneSelect={false}
      popoverProps={{ usePortal: false, placement }}
      disabled={disabled}
      shortcuts={shortcuts}
    />
  )
}

export default CustomDateInput
