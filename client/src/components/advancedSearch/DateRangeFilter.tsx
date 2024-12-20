import useSearchFilter from "components/advancedSearch/hooks"
import CustomDateInput from "components/CustomDateInput"
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
  ON,
  RANGE_TYPE_LABELS
} from "dateUtils"
import moment from "moment"
import React from "react"
import { Form } from "react-bootstrap"
import Settings from "settings"

const DATE_FORMAT = "YYYY-MM-DD"

interface DateRangeValueType {
  relative?: string | number
  start?: string | number | Date
  end?: string | number | Date
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
    end: null
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
          flexWrap: "wrap"
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
      </div>
    </Form.Group>
  )

  function handleChangeStart(newDate) {
    setValue(prevValue => {
      return { ...prevValue, start: newDate }
    })
  }

  function handleChangeEnd(newDate) {
    setValue(prevValue => {
      return { ...prevValue, end: newDate }
    })
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

  if (query[startKey]) {
    toQueryValue[startKey] = query[startKey]
    const lastValues = [LAST_DAY, LAST_WEEK, LAST_MONTH]
    if (lastValues.indexOf(+query[startKey]) !== -1) {
      filterValue.relative = query[startKey]
    } else {
      filterValue.start = moment(query[startKey]).format(DATE_FORMAT)
      if (query[endKey]) {
        filterValue.relative = BETWEEN
      } else {
        filterValue.relative = AFTER
      }
    }
  }

  if (query[endKey]) {
    filterValue.end = moment(query[endKey]).format(DATE_FORMAT)
    toQueryValue[endKey] = query[endKey]
    if (!query[startKey]) {
      filterValue.relative = BEFORE
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
