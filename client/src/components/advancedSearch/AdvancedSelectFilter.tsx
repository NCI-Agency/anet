import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import React from "react"

interface AdvancedSelectFilterProps {
  // An AdvancedSingleSelect filter allows users to search the ANET database
  // for existing records and use that records ID as the search term.
  // The queryKey property tells this filter what property to set on the
  // search query (ie authorUuid, organizationUuid, etc).
  queryKey: string
  objectType: (...args: unknown[]) => unknown
  value?: any
  onChange?: (...args: unknown[]) => unknown
  valueKey: string
  valueFunc?: (...args: unknown[]) => unknown
  fields?: string
  asFormField?: boolean
}

const AdvancedSelectFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  valueKey,
  valueFunc = (v, k) => v?.[k],
  fields = "",
  ...advancedSelectProps
}: AdvancedSelectFilterProps) => {
  const defaultValue = inputValue || {}
  const toQuery = val => ({ [queryKey]: val?.uuid ?? null })
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  return !asFormField ? (
    <>{valueFunc(value, valueKey)}</>
  ) : (
    <AdvancedSingleSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      onChange={handleChange}
      value={value}
      valueKey={valueKey}
      valueFunc={valueFunc}
      fields={fields}
      smallOverlay
    />
  )

  function handleChange(event) {
    if (typeof event === "object") {
      setValue(event)
    }
  }
}

export const deserialize = ({ queryKey, objectType, fields }, query, key) => {
  if (Object.hasOwn(query, queryKey)) {
    const emptyResult = { key, value: { toQuery: { [queryKey]: null } } }
    if (query[queryKey] == null) {
      return emptyResult
    }
    const getInstanceName = objectType.getInstanceName
    return API.query(
      gql`
        query($uuid: String!) {
          ${getInstanceName}(uuid: $uuid) {
            ${fields}
          }
        }
      `,
      { uuid: query[queryKey] }
    )
      .then(data => ({
        key,
        value: {
          ...(data[getInstanceName] ?? {}),
          toQuery: {
            [queryKey]: query[queryKey]
          }
        }
      }))
      .catch(() => emptyResult)
  }
  return null
}

export default AdvancedSelectFilter
