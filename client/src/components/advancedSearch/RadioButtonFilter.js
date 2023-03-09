import useSearchFilter from "components/advancedSearch/hooks"
import PropTypes from "prop-types"
import React from "react"
import { FormCheck, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"
import utils from "utils"

const RadioButtonFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange,
  options,
  defaultOption,
  labels
}) => {
  const defaultValue = {
    value: inputValue.value ?? defaultOption ?? options[0]
  }
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

  const optionsLabels = labels || options.map(v => utils.sentenceCase(v))
  return !asFormField ? (
    <>{optionsLabels[options.indexOf(value.value)]}</>
  ) : (
    <FormGroup>
      {options.map((v, idx) => (
        <FormCheck
          key={idx}
          type="radio"
          inline
          label={optionsLabels[idx]}
          id={`${queryKey}.${v}`}
          value={v}
          checked={v === value.value}
          onChange={() => setValue({ value: v })}
        />
      ))}
    </FormGroup>
  )
}
RadioButtonFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  defaultOption: PropTypes.any,
  labels: PropTypes.array,
  value: PropTypes.oneOfType([
    PropTypes.any,
    PropTypes.shape({
      value: PropTypes.any,
      toQuery: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    })
  ]),
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  asFormField: PropTypes.bool
}
RadioButtonFilter.defaultProps = {
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default RadioButtonFilter
