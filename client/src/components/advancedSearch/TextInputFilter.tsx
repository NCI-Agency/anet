import useSearchFilter from "components/advancedSearch/hooks"
import React from "react"
import { FormControl, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"

interface TextInputFilterProps {
  queryKey: string
  value?:
    | string
    | {
        value?: string
        toQuery?: (...args: unknown[]) => unknown
      }
  onChange?: (...args: unknown[]) => unknown
  // Passed by the SearchFilterDisplay row
  asFormField?: boolean
}

const TextInputFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange
}: TextInputFilterProps) => {
  const defaultValue = inputValue || { value: "" }
  const toQuery = val => {
    return { [queryKey]: val.value ?? null }
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

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default TextInputFilter
