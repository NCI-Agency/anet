import useSearchFilter from "components/advancedSearch/hooks"
import React from "react"
import { FormCheck, FormGroup } from "react-bootstrap"
import { deserializeSearchFilter } from "searchUtils"

interface CheckboxFilterProps {
  msg?: string
  queryKey: string
  onChange?: (...args: unknown[]) => unknown
  asFormField?: boolean // FIXME: XXXeslint-disable-line react/no-unused-prop-types
}

const CheckboxFilter = ({
  msg = "Authorized for me",
  asFormField = true,
  queryKey,
  onChange
}: CheckboxFilterProps) => {
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
      <FormCheck
        type="checkbox"
        label={msg}
        id={queryKey}
        readOnly
        checked={value.value}
      />
    </FormGroup>
  )
}

export const deserialize = ({ queryKey }, query, key) => {
  return deserializeSearchFilter(queryKey, query, key)
}

export default CheckboxFilter
