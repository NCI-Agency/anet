import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { Checkbox, FormGroup } from "react-bootstrap"

const CheckboxSearchFilter = props => {
  const { asFormField, onChange, queryKey } = props
  const value = { value: true }

  useEffect(() => {
    if (asFormField) {
      onChange({
        ...value,
        toQuery: () => ({ [queryKey]: value.value })
      })
    }
  }, [asFormField, onChange, queryKey, value])

  const msg = "Authorized for me"
  return !asFormField ? (
    <>{msg}</>
  ) : (
    <FormGroup>
      <Checkbox readOnly checked={value.value}>
        {msg}
      </Checkbox>
    </FormGroup>
  )
}
CheckboxSearchFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  asFormField: PropTypes.bool
}
CheckboxSearchFilter.defaultProps = {
  asFormField: true
}

export const deserializeCheckboxSearchFilter = (props, query, key) => {
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

export default CheckboxSearchFilter
