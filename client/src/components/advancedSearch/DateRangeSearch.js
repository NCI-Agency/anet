import { Settings } from "api"
import autobind from "autobind-decorator"
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
  RANGE_TYPE_LABELS
} from "dateUtils"
import _isEqualWith from "lodash/isEqualWith"
import _uniqueId from "lodash/uniqueId"
import moment from "moment"
import PropTypes from "prop-types"
import React, { Component } from "react"
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

export default class DateRangeSearch extends Component {
  static propTypes = {
    onlyBetween: PropTypes.bool,
    value: PropTypes.oneOfType([dateRangeValue, PropTypes.string]),

    // Passed by the SearchFilterDisplay row
    asFormField: PropTypes.bool
  }

  static defaultProps = {
    onlyBetween: false,
    asFormField: true
  }

  constructor(props) {
    super(props)
    const value = props.value || {}
    this.state = {
      value: {
        relative: value.relative || BETWEEN,
        start: value.start || null,
        end: value.end || null
      },
      ids: {
        between: _uniqueId("dateRange_"),
        before: _uniqueId("dateRange_"),
        after: _uniqueId("dateRange_"),
        last_day: _uniqueId("dateRange_"),
        last_week: _uniqueId("dateRange_"),
        last_month: _uniqueId("dateRange_")
      }
    }
  }

  selectMenu = onlyBetween => {
    const betweenOption = (
      <option key={this.state.ids.between} value={BETWEEN}>
        Between
      </option>
    )
    const remainingOptions = [
      <option key={this.state.ids.before} value={BEFORE}>
        {RANGE_TYPE_LABELS[BEFORE]}
      </option>,
      <option key={this.state.ids.after} value={AFTER}>
        {RANGE_TYPE_LABELS[AFTER]}
      </option>,
      <option key={this.state.ids.last_day} value={LAST_DAY}>
        {RANGE_TYPE_LABELS[LAST_DAY]}
      </option>,
      <option key={this.state.ids.last_week} value={LAST_WEEK}>
        {RANGE_TYPE_LABELS[LAST_WEEK]}
      </option>,
      <option key={this.state.ids.last_month} value={LAST_MONTH}>
        {RANGE_TYPE_LABELS[LAST_MONTH]}
      </option>
    ]
    const options = onlyBetween
      ? betweenOption
      : [betweenOption, ...remainingOptions]

    return (
      <select
        disabled={onlyBetween}
        value={this.state.value.relative}
        onChange={this.onChangeRelative}
        style={{ marginRight: 5, height: "38px" }}
      >
        {options}
      </select>
    )
  }

  render() {
    let { value } = this.state
    let dateRangeDisplay = RANGE_TYPE_LABELS[value.relative].concat(" ")
    if (value.relative === BETWEEN || value.relative === AFTER) {
      dateRangeDisplay = dateRangeDisplay.concat(
        moment(value.start).format(Settings.dateFormats.forms.short)
      )
    }
    if (value.relative === BETWEEN) {
      dateRangeDisplay = dateRangeDisplay.concat(" and ")
    }
    if (value.relative === BETWEEN || value.relative === BEFORE) {
      dateRangeDisplay = dateRangeDisplay.concat(
        moment(value.end).format(Settings.dateFormats.forms.short)
      )
    }
    const dateStart = value.start && moment(value.start).toDate()
    const dateEnd = value.end && moment(value.end).toDate()
    return !this.props.asFormField ? (
      dateRangeDisplay
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {this.selectMenu(this.props.onlyBetween)}
        {(value.relative === BETWEEN || value.relative === AFTER) && (
          <CustomDateInput
            showIcon={false}
            value={dateStart}
            onChange={this.onChangeStart}
          />
        )}
        {value.relative === BETWEEN && (
          <span style={{ marginLeft: 5, marginRight: 5 }}>and</span>
        )}
        {(value.relative === BETWEEN || value.relative === BEFORE) && (
          <CustomDateInput
            showIcon={false}
            value={dateEnd}
            onChange={this.onChangeEnd}
          />
        )}
      </div>
    )
  }

  componentDidMount() {
    this.updateFilter()
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !_isEqualWith(
        prevProps.value,
        this.props.value,
        utils.treatFunctionsAsEqual
      )
    ) {
      this.setState({ value: this.props.value }, this.updateFilter)
    }
  }

  @autobind
  onChangeStart(newDate) {
    let { value } = this.state
    value.start = newDate
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  onChangeEnd(newDate) {
    let { value } = this.state
    value.end = newDate
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  onChangeRelative(newValue) {
    let { value } = this.state
    value.relative = newValue.target.value
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  toQuery() {
    let { queryKey } = this.props
    let { value } = this.state
    return dateToQuery(queryKey, value)
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      let { value } = this.state
      value.toQuery = this.toQuery
      this.props.onChange(value)
    }
  }

  @autobind
  deserialize(query, key) {
    const startKey = dateRangeStartKey(this.props.queryKey)
    const endKey = dateRangeEndKey(this.props.queryKey)
    const toQueryValue = {}
    const filterValue = {}
    if (query[startKey] && query[endKey]) {
      filterValue.relative = BETWEEN
      filterValue.start = moment(query[startKey]).format(DATE_FORMAT)
      filterValue.end = moment(query[endKey]).format(DATE_FORMAT)
      toQueryValue[startKey] = query[startKey]
      toQueryValue[endKey] = query[endKey]
    } else if (query[startKey]) {
      toQueryValue[startKey] = query[startKey]
      const lastValues = [LAST_DAY, LAST_WEEK, LAST_MONTH]
      if (lastValues.indexOf(+query[startKey]) !== -1) {
        filterValue.relative = query[startKey]
      } else {
        filterValue.relative = AFTER
        filterValue.start = moment(query[startKey]).format(DATE_FORMAT)
      }
    } else if (query[endKey]) {
      filterValue.relative = BEFORE
      filterValue.end = moment(query[endKey]).format(DATE_FORMAT)
      toQueryValue[endKey] = query[endKey]
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
}
