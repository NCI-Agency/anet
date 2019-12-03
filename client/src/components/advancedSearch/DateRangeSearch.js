import { Settings } from "api"
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
import _isEqualWith from "lodash/isEqualWith"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { FormGroup } from "react-bootstrap"
import utils from "utils"

const DATE_FORMAT = "YYYY-MM-DD"

const dateRangeValue = PropTypes.shape({
  relative: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  start: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ]),
  end: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ])
})

const DateRangeSearch = props => {
  const { asFormField, onChange, onlyBetween, queryKey } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(
    props.value || {
      relative: BETWEEN,
      start: null,
      end: null
    }
  )

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
    if (asFormField) {
      onChange({ ...value, toQuery: () => dateToQuery(queryKey, value) })
    }
  }, [asFormField, onChange, props.value, queryKey, value, valuePropUnchanged])

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
      <select
        disabled={onlyBetween}
        value={value.relative}
        onChange={onChangeRelative}
        style={{ marginRight: 5, height: "38px" }}
      >
        {options}
      </select>
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
    <FormGroup>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {selectMenu(onlyBetween)}
        {(value.relative === BETWEEN ||
          value.relative === AFTER ||
          value.relative === ON) && (
          <CustomDateInput
            showIcon={false}
            value={dateStart}
            onChange={onChangeStart}
          />
        )}
        {value.relative === BETWEEN && (
          <span style={{ marginLeft: 5, marginRight: 5 }}>and</span>
        )}
        {(value.relative === BETWEEN || value.relative === BEFORE) && (
          <CustomDateInput
            showIcon={false}
            value={dateEnd}
            onChange={onChangeEnd}
          />
        )}
      </div>
    </FormGroup>
  )

  function onChangeStart(newDate) {
    setValue(prevValue => {
      return { ...prevValue, start: newDate }
    })
  }

  function onChangeEnd(newDate) {
    setValue(prevValue => {
      return { ...prevValue, end: newDate }
    })
  }

  function onChangeRelative(newValue) {
    setValue(prevValue => {
      return { ...prevValue, relative: newValue.target.value }
    })
  }
}
DateRangeSearch.propTypes = {
  queryKey: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onlyBetween: PropTypes.bool,
  value: PropTypes.oneOfType([dateRangeValue, PropTypes.string]),
  asFormField: PropTypes.bool
}
DateRangeSearch.defaultProps = {
  onlyBetween: false,
  asFormField: true
}

export const deserializeDateRangeSearch = (props, query, key) => {
  const startKey = dateRangeStartKey(props.queryKey)
  const endKey = dateRangeEndKey(props.queryKey)
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
      key: key,
      value: {
        ...filterValue,
        toQuery: () => toQueryValue
      }
    }
  }
  return null
}

export default DateRangeSearch
