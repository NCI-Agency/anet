import useSearchFilter from "components/advancedSearch/hooks"
import { Position } from "models"
import PropTypes from "prop-types"
import React from "react"
import { FormGroup } from "react-bootstrap"
import utils from "utils"

const advisorSearchPositionTypes = [
  Position.TYPE.ADVISOR,
  Position.TYPE.SUPER_USER,
  Position.TYPE.ADMINISTRATOR
]

const SelectFilter = props => {
  const { asFormField, isPositionTypeFilter, queryKey, values } = props
  const defaultValue = {
    value: props.value.value || props.values[0] || ""
  }
  const toQuery = val => {
    // Searching for advisors implies searching for super users and admins as well
    const valueForQuery =
      isPositionTypeFilter && val.value === Position.TYPE.ADVISOR
        ? advisorSearchPositionTypes
        : val.value
    return { [queryKey]: valueForQuery }
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery)

  const labels = props.labels || values.map(v => utils.sentenceCase(v))
  return !asFormField ? (
    <>{labels[values.indexOf(value.value)]}</>
  ) : (
    <FormGroup>
      <select value={value.value} onChange={handleChange}>
        {values.map((v, idx) => (
          <option key={idx} value={v}>
            {labels[idx]}
          </option>
        ))}
      </select>
    </FormGroup>
  )

  function handleChange(event) {
    setValue({ value: event.target.value })
  }
}
SelectFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  values: PropTypes.array.isRequired,
  labels: PropTypes.array,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.string,
      toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    })
  ]),
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  asFormField: PropTypes.bool,
  isPositionTypeFilter: PropTypes.bool
}
SelectFilter.defaultProps = {
  asFormField: true
}

export const deserializeSelectFilter = (props, query, key) => {
  if (query[props.queryKey]) {
    const toQueryValue = { [props.queryKey]: query[props.queryKey] }
    return {
      key: key,
      value: {
        value: query[props.queryKey],
        toQuery: () => toQueryValue
      }
    }
  }
  return null
}

export default SelectFilter
