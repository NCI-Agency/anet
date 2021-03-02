import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { Checkbox, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"

const CheckboxFilter = ({ msg, asFormField, queryKey, onChange }) => {
  const defaultValue = { value: true }
  const toQuery = val => {
    return { [queryKey]: val.value }
  }
  const value = useSearchFilter(
    asFormField,
    onChange,
    undefined,
    defaultValue,
    toQuery
  )[0]

  return !asFormField ? (
    <>{msg}</>
  ) : (
    <FormGroup>
      <Checkbox id={queryKey} readOnly checked={value.value}>
        {msg}
      </Checkbox>
    </FormGroup>
  )
}
CheckboxFilter.propTypes = {
  msg: PropTypes.string,
  queryKey: PropTypes.string.isRequired,
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  asFormField: PropTypes.bool
}
CheckboxFilter.defaultProps = {
  msg: "Authorized for me",
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default CheckboxFilter
