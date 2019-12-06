import _isEqualWith from "lodash/isEqualWith"
import _map from "lodash/map"
import { Report } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { FormGroup } from "react-bootstrap"
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

const ReportStateSearch = props => {
  const { asFormField, onChange } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState({
    state: props.value.state || [Report.STATE.DRAFT],
    cancelledReason: props.value.cancelledReason || ""
  })
  const onlyCancelled =
    value.state.length === 1 && value.state[0] === Report.STATE.CANCELLED

  useEffect(() => {
    function toQuery() {
      let query = { state: value.state }
      if (onlyCancelled && value.cancelledReason) {
        query.cancelledReason = value.cancelledReason
      }
      return query
    }

    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
    if (asFormField) {
      onChange({ ...value, toQuery: toQuery })
    }
  }, [
    asFormField,
    onChange,
    onlyCancelled,
    props.value,
    value,
    valuePropUnchanged
  ])

  const labels = value.state.map(s => STATE_LABELS[s])

  let stateDisplay = labels.join(" or ")
  if (onlyCancelled && value.cancelledReason) {
    const reason = Report.CANCELLATION_REASON[value.cancelledReason]
    stateDisplay = stateDisplay.concat(" due to ")
    stateDisplay = stateDisplay.concat(CANCELLATION_REASON_LABELS[reason])
  }
  return !asFormField ? (
    stateDisplay
  ) : (
    <FormGroup>
      <select value={value.state} onChange={changeState} multiple>
        {Object.keys(STATE_LABELS).map(key => (
          <option key={key} value={key}>
            {STATE_LABELS[key]}
          </option>
        ))}
      </select>
      {onlyCancelled && (
        <span style={{ verticalAlign: "top", paddingLeft: "8px" }}>
          due to{" "}
          <select
            value={value.cancelledReason}
            onChange={changeCancelledReason}
          >
            <option value="">Everything</option>
            {Object.keys(CANCELLATION_REASON_LABELS).map(key => (
              <option key={key} value={key}>
                {CANCELLATION_REASON_LABELS[key]}
              </option>
            ))}
          </select>
        </span>
      )}
    </FormGroup>
  )

  function changeState(event) {
    const selectedOptions =
      event.target.selectedOptions ||
      Array.from(event.target.options).filter(o => o.selected)
    setValue(prevValue => ({
      ...prevValue,
      state: _map(selectedOptions, o => o.value)
    }))
  }

  function changeCancelledReason(event) {
    const reason = event.target.value // synthetic event outside async context
    setValue(prevValue => ({ ...prevValue, cancelledReason: reason }))
  }
}
ReportStateSearch.propTypes = {
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
ReportStateSearch.defaultProps = {
  asFormField: true
}

export const deserializeReportStateSearch = (props, query, key) => {
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

export default ReportStateSearch
