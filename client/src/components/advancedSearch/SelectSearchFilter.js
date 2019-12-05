import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { FormGroup } from "react-bootstrap"
import utils from "utils"

const SelectSearchFilter = props => {
  const { asFormField, onChange, queryKey } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState({
    value: props.value.value || props.values[0] || ""
  })

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
    if (asFormField) {
      onChange({ ...value, toQuery: () => ({ [queryKey]: value.value }) })
    }
  }, [asFormField, onChange, props.value, queryKey, value, valuePropUnchanged])

  let values = props.values
  let labels = props.labels || values.map(v => utils.sentenceCase(v))
  return !props.asFormField ? (
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
SelectSearchFilter.propTypes = {
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
  onChange: PropTypes.func,
  asFormField: PropTypes.bool
}
SelectSearchFilter.defaultProps = {
  asFormField: true
}

export const deserializeSelectSearchFilter = (props, query, key) => {
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

export default SelectSearchFilter
