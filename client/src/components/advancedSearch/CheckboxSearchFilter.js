import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { Checkbox, FormGroup } from "react-bootstrap"

const CheckboxSearchFilter = props => {
  const { asFormField, queryKey } = props
  const defaultValue = { value: true }
  const toQuery = val => {
    return { [queryKey]: val.value }
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery) // eslint-disable-line no-unused-vars

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
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
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
