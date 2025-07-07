import useSearchFilter from "components/advancedSearch/hooks"
import CustomDateInput from "components/CustomDateInput"
import IntegerInput from "components/IntegerInput"
import {
  AFTER,
  BEFORE,
  BETWEEN,
  dateRangeEndKey,
  dateRangeStartKey,
  dateToQuery,
  LAST_DAY,
  LAST_MONTH,
  LAST_WEEK,
  LAST_X_DAYS,
  NEXT_DAY,
  NEXT_MONTH,
  NEXT_WEEK,
  NEXT_X_DAYS,
  ON,
  RANGE_TYPE_LABELS
} from "dateUtils"
import moment from "moment"
import pluralize from "pluralize"
import React from "react"
import { Form } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const DATE_FORMAT = "YYYY-MM-DD"

interface DateRangeValueType {
  relative?: string | number
  start?: string | number | Date
  end?: string | number | Date
  days?: number
}

interface DateRangeFilterProps {
  queryKey: string
  onChange?: (...args: unknown[]) => unknown
  onlyBetween?: boolean
  value?: DateRangeValueType | string
  asFormField?: boolean
}

const DateRangeFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  onlyBetween = false
}: DateRangeFilterProps) => {
  const defaultValue = inputValue || {
    relative: BETWEEN,
    start: null,
    end: null,
    days: null
  }
  const toQuery = val => {
    return dateToQuery(queryKey, val)
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const selectMenu = onlyBetween => {
    const betweenOption = (
      <option key="between" value={BETWEEN}>
        Between
      </option>
    )
    const remainingOptions = [
      <option key="before" value={BEFORE}>
        {RANGE_TYPE_LABELS[BEFORE]}
      </option>,
      <option key="after" value={AFTER}>
        {RANGE_TYPE_LABELS[AFTER]}
      </option>,
      <option key="on" value={ON}>
        {RANGE_TYPE_LABELS[ON]}
      </option>,
      <option key="last_day" value={LAST_DAY}>
        {RANGE_TYPE_LABELS[LAST_DAY]}
      </option>,
      <option key="last_week" value={LAST_WEEK}>
        {RANGE_TYPE_LABELS[LAST_WEEK]}
      </option>,
      <option key="last_month" value={LAST_MONTH}>
        {RANGE_TYPE_LABELS[LAST_MONTH]}
      </option>,
      <option key="last_x_days" value={LAST_X_DAYS}>
        {RANGE_TYPE_LABELS[LAST_X_DAYS]}
      </option>,
      <option key="next_day" value={NEXT_DAY}>
        {RANGE_TYPE_LABELS[NEXT_DAY]}
      </option>,
      <option key="next_week" value={NEXT_WEEK}>
        {RANGE_TYPE_LABELS[NEXT_WEEK]}
      </option>,
      <option key="next_month" value={NEXT_MONTH}>
        {RANGE_TYPE_LABELS[NEXT_MONTH]}
      </option>,
      <option key="next_x_days" value={NEXT_X_DAYS}>
        {RANGE_TYPE_LABELS[NEXT_X_DAYS]}
      </option>
    ]
    const options = onlyBetween
      ? betweenOption
      : [betweenOption, ...remainingOptions]
    return (
      <Form.Select
        id={queryKey}
        disabled={onlyBetween}
        value={value.relative}
        onChange={handleChangeRelative}
        style={{ marginRight: 5, width: "12rem" }}
      >
        {options}
      </Form.Select>
    )
  }
  let dateRangeDisplay = RANGE_TYPE_LABELS[value.relative].concat(" ")
  if (
    value.relative === BETWEEN ||
    value.relative === AFTER ||
    value.relative === ON
  ) {
    dateRangeDisplay = dateRangeDisplay.concat(
      moment(value.start).format(Settings.dateFormats.forms.displayShort.date)
    )
  }
  if (value.relative === BETWEEN) {
    dateRangeDisplay = dateRangeDisplay.concat(" and ")
  }
  if (value.relative === BETWEEN || value.relative === BEFORE) {
    dateRangeDisplay = dateRangeDisplay.concat(
      moment(value.end).format(Settings.dateFormats.forms.displayShort.date)
    )
  }
  if (value.relative === LAST_X_DAYS) {
    dateRangeDisplay = `Last ${value.days ?? "?"} ${pluralize("day", value.days)}`
  }
  if (value.relative === NEXT_X_DAYS) {
    dateRangeDisplay = `Next ${value.days ?? "?"} ${pluralize("day", value.days)}`
  }
  const dateStart = value.start && moment(value.start).toDate()
  const dateEnd = value.end && moment(value.end).toDate()
  return !asFormField ? (
    dateRangeDisplay
  ) : (
    <Form.Group>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 5
        }}
      >
        {selectMenu(onlyBetween)}
        {(value.relative === BETWEEN ||
          value.relative === AFTER ||
          value.relative === ON) && (
          <CustomDateInput
            showIcon={false}
            placement="right"
            value={dateStart}
            onChange={handleChangeStart}
          />
        )}
        {value.relative === BETWEEN && (
          <span style={{ marginLeft: 5, marginRight: 5 }}>and</span>
        )}
        {(value.relative === BETWEEN || value.relative === BEFORE) && (
          <CustomDateInput
            showIcon={false}
            placement="left"
            value={dateEnd}
            onChange={handleChangeEnd}
          />
        )}
        {[NEXT_X_DAYS, LAST_X_DAYS].includes(value.relative) && (
          <IntegerInput
            min={1}
            max={999}
            value={value.days}
            onValueChange={handleChangeDays}
            placeholder="Days"
          />
        )}
      </div>
    </Form.Group>
  )

  function handleChangeStart(newDate) {
    setValue(prevValue => ({ ...prevValue, start: newDate }))
  }

  function handleChangeEnd(newDate) {
    setValue(prevValue => ({ ...prevValue, end: newDate }))
  }

  function handleChangeDays(newValue) {
    setValue(prevValue => ({ ...prevValue, days: newValue }))
  }

  function handleChangeRelative(newValue) {
    const relativeVal = newValue.target.value // synthetic event outside async context
    setValue(prevValue => {
      return { ...prevValue, relative: relativeVal }
    })
  }
}

export const deserialize = ({ queryKey }, query, key) => {
  const startKey = dateRangeStartKey(queryKey)
  const endKey = dateRangeEndKey(queryKey)
  const toQueryValue = {}
  const filterValue = {}

  if (Object.hasOwn(query, startKey)) {
    const startVal = query[startKey]
    toQueryValue[startKey] = startVal
    const lastValues = [LAST_DAY, LAST_WEEK, LAST_MONTH]
    if (lastValues.indexOf(+startVal) !== -1) {
      filterValue.relative = startVal
    } else if (utils.isNumeric(startVal)) {
      filterValue.relative = LAST_X_DAYS
      filterValue.days = parseInt(startVal) / LAST_DAY
    } else {
      filterValue.start = moment(startVal).format(DATE_FORMAT)
      if (Object.hasOwn(query, endKey)) {
        filterValue.relative = BETWEEN
      } else {
        filterValue.relative = AFTER
      }
    }
  }

  if (Object.hasOwn(query, endKey)) {
    const endVal = query[endKey]
    toQueryValue[endKey] = endVal
    const nextValues = [NEXT_DAY, NEXT_WEEK, NEXT_MONTH]
    if (nextValues.indexOf(+endVal) !== -1) {
      filterValue.relative = endVal
    } else if (utils.isNumeric(endVal)) {
      filterValue.relative = NEXT_X_DAYS
      filterValue.days = parseInt(endVal) / NEXT_DAY
    } else {
      filterValue.end = moment(endVal).format(DATE_FORMAT)
      if (!Object.hasOwn(query, startKey)) {
        filterValue.relative = BEFORE
      }
    }
  }

  if (Object.keys(filterValue).length) {
    return {
      key,
      value: {
        ...filterValue,
        toQuery: toQueryValue
      }
    }
  }
  return null
}

export default DateRangeFilter
