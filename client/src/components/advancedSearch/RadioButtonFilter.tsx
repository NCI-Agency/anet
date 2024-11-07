import useSearchFilter from "components/advancedSearch/hooks"
import React from "react"
import { FormCheck, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"
import utils from "utils"

interface RadioButtonFilterProps {
  queryKey: string
  options: any[]
  defaultOption?: any
  labels?: any[]
  value?:
    | any
    | {
        value?: any
        toQuery?: (...args: unknown[]) => unknown
      }
  onChange?: (...args: unknown[]) => unknown
  asFormField?: boolean // FIXME: XXXeslint-disable-line react/no-unused-prop-types
}

const RadioButtonFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  options,
  defaultOption,
  labels
}: RadioButtonFilterProps) => {
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

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default RadioButtonFilter
