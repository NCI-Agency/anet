import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { useState, useRef, useEffect } from "react"
import { FormControl, FormGroup } from "react-bootstrap"
import utils from "utils"

const TextInputFilter = props => {
  const { asFormField, onChange, queryKey } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(props.value || { value: "" })

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
    if (asFormField) {
      onChange({ ...value, toQuery: () => ({ [queryKey]: value.value }) })
    }
  }, [asFormField, onChange, props.value, queryKey, value, valuePropUnchanged])

  return !props.asFormField ? (
    <>{value.value}</>
  ) : (
    <FormGroup>
      <FormControl value={value.value} onChange={handleChange} />
    </FormGroup>
  )

  function handleChange(event) {
    setValue({ value: event.target.value })
  }
}

TextInputFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.string,
      toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    })
  ]),
  onChange: PropTypes.func,
  // Passed by the SearchFilterDisplay row
  asFormField: PropTypes.bool
}

TextInputFilter.defaultProps = {
  asFormField: true
}

export const deserializeTextInputFilter = (props, query, key) => {
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

export default TextInputFilter
