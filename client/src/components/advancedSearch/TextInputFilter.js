import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { FormControl, FormGroup } from "react-bootstrap"

const TextInputFilter = props => {
  const { asFormField, queryKey } = props
  const defaultValue = props.value || { value: "" }
  const toQuery = val => {
    return { [queryKey]: val.value }
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery) // eslint-disable-line no-unused-vars

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
