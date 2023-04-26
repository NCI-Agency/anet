import useSearchFilter from "components/advancedSearch/hooks"
import _map from "lodash/map"
import { Report } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Form } from "react-bootstrap"

const CANCELLATION_REASON_LABELS = {
  [Report.CANCELLATION_REASON.CANCELLED_BY_ADVISOR]: "Advisor",
  [Report.CANCELLATION_REASON.CANCELLED_BY_INTERLOCUTOR]: "Interlocutor",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_TRANSPORTATION]:
    "Transportation",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_FORCE_PROTECTION]:
    "Force Protection",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_ROUTES]: "Routes",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_THREAT]: "Threat",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS]:
    "Availability of Interpreter(s)",
  [Report.CANCELLATION_REASON.CANCELLED_DUE_TO_NETWORK_ISSUES]:
    "Network / Connectivity Issues"
}

const ReportStateFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange
}) => {
  const isOnlyCancelled = val => {
    return val.state.length === 1 && val.state[0] === Report.STATE.CANCELLED
  }
  const defaultValue = {
    state: inputValue.state || [Report.STATE.PUBLISHED],
    cancelledReason: inputValue.cancelledReason || ""
  }
  const toQuery = val => {
    const onlyCancelled = isOnlyCancelled(val)
    const query = { state: val.state }
    if (onlyCancelled && val.cancelledReason) {
      query.cancelledReason = val.cancelledReason
    }
    return query
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const labels = value.state.map(s => Report.STATE_LABELS[s])
  const onlyCancelled = isOnlyCancelled(value)
  let stateDisplay = labels.join(" or ")
  if (onlyCancelled && value.cancelledReason) {
    const reason = Report.CANCELLATION_REASON[value.cancelledReason]
    stateDisplay = stateDisplay.concat(" due to ")
    stateDisplay = stateDisplay.concat(CANCELLATION_REASON_LABELS[reason])
  }
  return !asFormField ? (
    stateDisplay
  ) : (
    <Form.Group>
      <Form.Select
        id={queryKey}
        value={value.state}
        onChange={handleChangeState}
        multiple
      >
        {Object.entries(Report.STATE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Form.Select>
      {onlyCancelled && (
        <div style={{ verticalAlign: "top", paddingLeft: "8px" }}>
          due to{" "}
          <Form.Select
            id={queryKey}
            value={value.cancelledReason}
            onChange={handleChangeCancelledReason}
          >
            <option value="">Everything</option>
            {Object.entries(CANCELLATION_REASON_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Form.Select>
        </div>
      )}
    </Form.Group>
  )

  function handleChangeState(event) {
    const selectedOptions =
      event.target.selectedOptions ||
      Array.from(event.target.options).filter(o => o.selected)
    setValue(prevValue => ({
      ...prevValue,
      state: _map(selectedOptions, o => o.value)
    }))
  }

  function handleChangeCancelledReason(event) {
    const reason = event.target.value // synthetic event outside async context
    setValue(prevValue => ({ ...prevValue, cancelledReason: reason }))
  }
}
ReportStateFilter.propTypes = {
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
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  // Passed by the SearchFilterDisplay row
  asFormField: PropTypes.bool
}
ReportStateFilter.defaultProps = {
  asFormField: true
}

export const deserialize = (props, query, key) => {
  if (query.state) {
    const value = { state: query.state }
    if (query.cancelledReason) {
      value.cancelledReason = query.cancelledReason
    }
    return {
      key,
      value: {
        ...value,
        toQuery: value
      }
    }
  }
  return null
}

export default ReportStateFilter
