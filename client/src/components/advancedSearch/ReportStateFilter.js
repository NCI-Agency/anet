import useSearchFilter from "components/advancedSearch/hooks"
import _map from "lodash/map"
import { Report } from "models"
import PropTypes from "prop-types"
import React from "react"
import { FormGroup } from "react-bootstrap"

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

const ReportStateFilter = props => {
  const { asFormField, queryKey } = props
  const isOnlyCancelled = val => {
    return val.state.length === 1 && val.state[0] === Report.STATE.CANCELLED
  }

  const defaultValue = {
    state: props.value.state || [Report.STATE.DRAFT],
    cancelledReason: props.value.cancelledReason || ""
  }
  const toQuery = val => {
    const onlyCancelled = isOnlyCancelled(val)
    const query = { state: val.state }
    if (onlyCancelled && val.cancelledReason) {
      query.cancelledReason = val.cancelledReason
    }
    return query
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery)

  const labels = value.state.map(s => STATE_LABELS[s])
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
    <FormGroup>
      <div
        style={{
          display: "flex",
          flexDirection: "row"
        }}
      >
        <select
          id={queryKey}
          value={value.state}
          onChange={handleChangeState}
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
              id={queryKey}
              value={value.cancelledReason}
              onChange={handleChangeCancelledReason}
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
    </FormGroup>
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

export const deserializeReportStateFilter = (props, query, key) => {
  if (query.state) {
    const value = { state: query.state }
    if (query.cancelledReason) {
      value.cancelledReason = query.cancelledReason
    }
    return {
      key: key,
      value: {
        ...value,
        toQuery: value
      }
    }
  }
  return null
}

export default ReportStateFilter
