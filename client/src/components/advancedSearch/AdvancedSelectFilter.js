import API from "api"
import { gql } from "apollo-boost"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import _isEqualWith from "lodash/isEqualWith"
import PropTypes from "prop-types"
import React, { useState, useEffect, useRef } from "react"
import utils from "utils"

const AdvancedSelectFilter = props => {
  const { asFormField, onChange, queryKey, valueKey } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(props.value || {})

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
    }
    if (asFormField) {
      onChange({
        ...value,
        toQuery: () => ({ [queryKey]: value && value.uuid })
      })
    }
  }, [asFormField, onChange, props.value, queryKey, value, valuePropUnchanged])

  const advancedSelectProps = Object.without(
    props,
    "value",
    "queryKey",
    "asFormField",
    "onChange"
  )
  return !asFormField ? (
    <>{props.value[valueKey]}</>
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
  onChange: PropTypes.func,
  valueKey: PropTypes.string.isRequired,
  fields: PropTypes.string,
  asFormField: PropTypes.bool
}
AdvancedSelectFilter.defaultProps = {
  fields: "",
  asFormField: true
}

export const deserializeAdvancedSelectFilter = (props, query, key) => {
  if (query[props.queryKey]) {
    const getInstanceName = props.objectType.getInstanceName
    return API.query(
      gql`
        query($uuid: String!) {
          ${getInstanceName}(uuid: $uuid) {
            ${props.fields}
          }
        }
      `,
      { uuid: query[props.queryKey] }
    ).then(data => {
      if (data[getInstanceName]) {
        const toQueryValue = {
          [props.queryKey]: query[props.queryKey]
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
