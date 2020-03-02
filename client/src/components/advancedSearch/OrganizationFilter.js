import API from "api"
import { gql } from "apollo-boost"
import useSearchFilter from "components/advancedSearch/hooks"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import { RECURSE_STRATEGY } from "components/SearchFilters"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const OrganizationFilter = ({
  asFormField,
  queryKey,
  value: inputValue,
  onChange,
  queryOrgRecurseStrategyKey,
  orgFilterQueryParams,
  ...advancedSelectProps
}) => {
  const defaultValue = {
    value: inputValue.value || {},
    orgRecurseStrategy: inputValue.orgRecurseStrategy || RECURSE_STRATEGY.NONE
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value.uuid,
      [queryOrgRecurseStrategyKey]: val.orgRecurseStrategy
    }
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  let msg = value.value.shortName
  if (msg && value.orgRecurseStrategy === RECURSE_STRATEGY.CHILDREN) {
    msg += ", including sub-organizations"
  } else if (msg && value.orgRecurseStrategy === RECURSE_STRATEGY.PARENTS) {
    msg += ", including parent organizations"
  }

  const advancedSelectFilters = {
    all: {
      label: "All",
      queryVars: orgFilterQueryParams
    }
  }

  return !asFormField ? (
    <>{msg}</>
  ) : (
    <div>
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
      <div>
        <ToggleButtonGroup
          type="radio"
          name="orgRecurseStrategy"
          value={value.orgRecurseStrategy}
          onChange={handleChangeOrgRecurseStrategy}
        >
          <ToggleButton value={RECURSE_STRATEGY.NONE}>exact match</ToggleButton>
          <ToggleButton value={RECURSE_STRATEGY.CHILDREN}>
            include sub-orgs
          </ToggleButton>
          <ToggleButton value={RECURSE_STRATEGY.PARENTS}>
            include parent orgs
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </div>
  )

  function handleChangeOrg(event) {
    if (typeof event === "object") {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }

  function handleChangeOrgRecurseStrategy(value) {
    setValue(prevValue => ({ ...prevValue, orgRecurseStrategy: value }))
  }
}
OrganizationFilter.propTypes = {
  queryKey: PropTypes.string.isRequired,
  queryOrgRecurseStrategyKey: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  orgFilterQueryParams: PropTypes.object,
  asFormField: PropTypes.bool
}
OrganizationFilter.defaultProps = {
  asFormField: true
}

export const deserialize = (
  { queryKey, queryOrgRecurseStrategyKey },
  query,
  key
) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_ORGANIZATION, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.organization) {
        const toQueryValue = {
          [queryKey]: query[queryKey]
        }
        const value = { value: data.organization }
        const orgRecurseStrategy = query[queryOrgRecurseStrategyKey]
        if (orgRecurseStrategy) {
          value.orgRecurseStrategy = orgRecurseStrategy
          toQueryValue[queryOrgRecurseStrategyKey] = orgRecurseStrategy
        }
        return {
          key: key,
          value: {
            ...value,
            toQuery: toQueryValue
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
