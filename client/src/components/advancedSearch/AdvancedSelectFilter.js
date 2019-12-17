import API from "api"
import { gql } from "apollo-boost"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import PropTypes from "prop-types"
import React from "react"

const AdvancedSelectFilter = props => {
  const { asFormField, queryKey, valueKey } = props
  const defaultValue = props.value || {}
  const toQuery = val => {
    return { [queryKey]: val && val.uuid }
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery)

  const advancedSelectProps = Object.without(
    props,
    "value",
    "queryKey",
    "asFormField",
    "onChange"
  )
  return !asFormField ? (
    <>{value[valueKey]}</>
  ) : (
    <AdvancedSingleSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      fieldLabel={null}
      vertical
      showRemoveButton={false}
      onChange={handleChange}
      value={value}
      smallOverlay
    />
  )

  function handleChange(event) {
    if (typeof event === "object") {
      setValue(event)
    }
  }
}
AdvancedSelectFilter.propTypes = {
  // An AdvancedSingleSelect filter allows users to search the ANET database
  // for existing records and use that records ID as the search term.
  // The queryKey property tells this filter what property to set on the
  // search query (ie authorUuid, organizationUuid, etc).
  queryKey: PropTypes.string.isRequired,
  objectType: PropTypes.func.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  valueKey: PropTypes.string.isRequired,
  fields: PropTypes.string,
  asFormField: PropTypes.bool
}
AdvancedSelectFilter.defaultProps = {
  fields: "",
  asFormField: true
}

export const deserializeAdvancedSelectFilter = (props, query, key) => {
  const { queryKey, objectType, fields } = props
  if (query[queryKey]) {
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
    ).then(data => {
      if (data[getInstanceName]) {
        const toQueryValue = {
          [queryKey]: query[queryKey]
        }
        return {
          key: key,
          value: {
            ...data[getInstanceName],
            toQuery: () => toQueryValue
          }
        }
      } else {
        return null
      }
    })
  }
  return null
}

export default AdvancedSelectFilter
