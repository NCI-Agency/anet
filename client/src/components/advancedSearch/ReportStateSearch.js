import autobind from "autobind-decorator"
import _isEqualWith from "lodash/isEqualWith"
import _map from "lodash/map"
import { Report } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import utils from "utils"

const STATE_LABELS = {
  [Report.STATE.DRAFT]: "Draft",
  [Report.STATE.PENDING_APPROVAL]: "Pending Approval",
  [Report.STATE.APPROVED]: "Approved",
  [Report.STATE.PUBLISHED]: "Published",
  [Report.STATE.CANCELLED]: "Cancelled",
  [Report.STATE.REJECTED]: "Changes requested"
}
const CANCELLATION_REASON_LABELS = {
  [Report.CANCELLATION_REASON.CANCELLED_BY_ADVISOR]: "Advisor",
  [Report.CANCELLATION_REASON.CANCELLED_BY_PRINCIPAL]: "Principal",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_TRANSPORTATION]:
    "Transportation",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_FORCE_PROTECTION]:
    "Force Protection",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_ROUTES]: "Routes",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_THREAT]: "Threat",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS]:
    "Availability of Interpreter(s)"
}

export default class ReportStateSearch extends Component {
  static propTypes = {
    queryKey: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        state: PropTypes.array,
        toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      }),
      PropTypes.shape({
        state: PropTypes.array,
        cancelledReason: PropTypes.string,
        toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      })
    ]),
    onChange: PropTypes.func,
    // Passed by the SearchFilterDisplay row
    asFormField: PropTypes.bool
  }

  static defaultProps = {
    asFormField: true
  }

  constructor(props) {
    super(props)

    const value = props.value || {}
    this.state = {
      value: {
        state: value.state || [Report.STATE.DRAFT],
        cancelledReason: value.cancelledReason || ""
      }
    }
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

  render() {
    const { value } = this.state
    const labels = value.state.map(s => STATE_LABELS[s])
    const onlyCancelled =
      value.state.length === 1 && value.state[0] === Report.STATE.CANCELLED
    let stateDisplay = labels.join(" or ")
    if (onlyCancelled && value.cancelledReason) {
      const reason = Report.CANCELLATION_REASON[value.cancelledReason]
      stateDisplay = stateDisplay.concat(" due to ")
      stateDisplay = stateDisplay.concat(CANCELLATION_REASON_LABELS[reason])
    }
    return !this.props.asFormField ? (
      stateDisplay
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "row"
        }}
      >
        <select
          id={this.props.queryKey}
          value={value.state}
          onChange={this.changeState}
          multiple
        >
          {Object.keys(STATE_LABELS).map(key => (
            <option key={key} value={key}>
              {STATE_LABELS[key]}
            </option>
          ))}
        </select>
        {onlyCancelled && (
          <div style={{ verticalAlign: "top", paddingLeft: "8px" }}>
            due to{" "}
            <select
              id={`${this.props.queryKey}CancelledReason`}
              value={value.cancelledReason}
              onChange={this.changeCancelledReason}
            >
              <option value="">Everything</option>
              {Object.keys(CANCELLATION_REASON_LABELS).map(key => (
                <option key={key} value={key}>
                  {CANCELLATION_REASON_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  }

  @autobind
  changeState(event) {
    const value = this.state.value
    const selectedOptions =
      event.target.selectedOptions ||
      Array.from(event.target.options).filter(o => o.selected)
    value.state = _map(selectedOptions, o => o.value)
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  changeCancelledReason(event) {
    const value = this.state.value
    value.cancelledReason = event.target.value
    this.setState({ value }, this.updateFilter)
  }

  @autobind
  toQuery() {
    const value = this.state.value
    const query = { state: value.state }
    const onlyCancelled =
      value.state.length === 1 && value.state[0] === Report.STATE.CANCELLED
    if (onlyCancelled && value.cancelledReason) {
      query.cancelledReason = value.cancelledReason
    }
    return query
  }

  @autobind
  updateFilter() {
    if (this.props.asFormField) {
      const { value } = this.state
      value.toQuery = this.toQuery
      this.props.onChange(value)
    }
  }

  @autobind
  deserialize(query, key) {
    if (query.state) {
      const value = { state: query.state }
      if (query.cancelledReason) {
        value.cancelledReason = query.cancelledReason
      }
      return {
        key: key,
        value: {
          ...value,
          toQuery: () => value
        }
      }
    }
    return null
  }
}
