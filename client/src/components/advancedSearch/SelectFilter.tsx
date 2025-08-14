import useSearchFilter from "components/advancedSearch/hooks"
import React from "react"
import { Form } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"
import utils from "utils"

interface SelectFilterProps {
  queryKey: string
  options: any[]
  labels?: any[]
  value?:
    | string
    | {
        value?: string
        toQuery?: (...args: unknown[]) => unknown
      }
  onChange?: (...args: unknown[]) => unknown
  asFormField?: boolean
}

const SelectFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  options,
  labels
}: SelectFilterProps) => {
  const defaultValue = {
    value: inputValue.value || options[0] || ""
  }
  const toQuery = val => ({ [queryKey]: val.value ?? null })
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

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default SelectFilter
