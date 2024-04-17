import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { Form } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"
import utils from "utils"

const SelectFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange,
  options,
  labels
}) => {
  const defaultValue = {
    value: inputValue.value || options[0] || ""
  }
  const toQuery = val => ({ [queryKey]: val.value })
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const optionsLabels = labels || options.map(v => utils.sentenceCase(v))
  return !asFormField ? (
    <>{optionsLabels[options.indexOf(value.value)]}</>
  ) : (
    <Form.Group>
      <Form.Select id={queryKey} value={value.value} onChange={handleChange}>
        {options.map((v, idx) => (
          <option key={idx} value={v}>
            {optionsLabels[idx]}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )

  function handleChange(event) {
    setValue({ value: event.target.value })
  }
}
SelectFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  labels: PropTypes.array,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.string,
      toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    })
  ]),
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  asFormField: PropTypes.bool
}
SelectFilter.defaultProps = {
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default SelectFilter
