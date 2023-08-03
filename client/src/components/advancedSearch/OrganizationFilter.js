import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import ORGANIZATIONS_ICON from "resources/organizations.png"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const OrganizationFilter = ({
  asFormField,
  queryKey,
  queryRecurseStrategyKey,
  fixedRecurseStrategy,
  value: inputValue,
  onChange,
  orgFilterQueryParams,
  ...advancedSelectProps
}) => {
  const defaultValue = {
    value: inputValue.value || {}
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value?.uuid,
      [queryRecurseStrategyKey]: fixedRecurseStrategy
    }
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const advancedSelectFilters = {
    all: {
      label: "All",
      queryVars: orgFilterQueryParams
    }
  }

  return !asFormField ? (
    <>{value.value?.shortName}</>
  ) : (
    <AdvancedSingleSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      fieldLabel={null}
      vertical
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={OrganizationOverlayRow}
      objectType={Organization}
      valueKey="shortName"
      fields={Organization.autocompleteQuery}
      placeholder="Filter by organization..."
      addon={ORGANIZATIONS_ICON}
      onChange={handleChangeOrg}
      value={value.value}
    />
  )

  function handleChangeOrg(event) {
    if (typeof event === "object") {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }
}
OrganizationFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  queryRecurseStrategyKey: PropTypes.string.isRequired,
  fixedRecurseStrategy: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  orgFilterQueryParams: PropTypes.object,
  asFormField: PropTypes.bool
}
OrganizationFilter.defaultProps = {
  asFormField: true
}

export const deserialize = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_ORGANIZATION, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.organization) {
        return {
          key,
          value: {
            value: data.organization,
            toQuery: { ...query }
          }
        }
      } else {
        return null
      }
    })
  }
  return null
}

export default OrganizationFilter
