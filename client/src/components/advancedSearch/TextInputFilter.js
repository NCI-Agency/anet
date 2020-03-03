import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { FormControl, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"

const TextInputFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange
}) => {
  const defaultValue = inputValue || { value: "" }
  const toQuery = val => {
    return { [queryKey]: val.value }
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  return !asFormField ? (
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
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  // Passed by the SearchFilterDisplay row
  asFormField: PropTypes.bool
}
TextInputFilter.defaultProps = {
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default TextInputFilter
