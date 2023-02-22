import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import { RECURSE_STRATEGY } from "searchUtils"

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
  value: inputValue,
  onChange,
  queryRecurseStrategyKey,
  fixedRecurseStrategy,
  orgFilterQueryParams,
  ...advancedSelectProps
}) => {
  const defaultValue = {
    value: inputValue.value || {},
    orgRecurseStrategy:
      fixedRecurseStrategy ||
      inputValue.orgRecurseStrategy ||
      RECURSE_STRATEGY.NONE
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value?.uuid,
      [queryRecurseStrategyKey]: val.orgRecurseStrategy
    }
  }
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  let msg = value.value?.shortName
  if (!fixedRecurseStrategy) {
    if (msg && value.orgRecurseStrategy === RECURSE_STRATEGY.CHILDREN) {
      msg += ", including sub-organizations"
    } else if (msg && value.orgRecurseStrategy === RECURSE_STRATEGY.PARENTS) {
      msg += ", including parent organizations"
    }
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
      {!fixedRecurseStrategy && (
        <div>
          <ToggleButtonGroup
            type="radio"
            name="orgRecurseStrategy"
            value={value.orgRecurseStrategy}
            onChange={handleChangeOrgRecurseStrategy}
          >
            <ToggleButton
              id="orgRecurseStrategyNone"
              value={RECURSE_STRATEGY.NONE}
              variant="outline-secondary"
            >
              exact match
            </ToggleButton>
            <ToggleButton
              id="orgRecurseStrategyChildren"
              value={RECURSE_STRATEGY.CHILDREN}
              variant="outline-secondary"
            >
              include sub-orgs
            </ToggleButton>
            <ToggleButton
              id="orgRecurseStrategyParents"
              value={RECURSE_STRATEGY.PARENTS}
              variant="outline-secondary"
            >
              include parent orgs
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      )}
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
  queryRecurseStrategyKey: PropTypes.string.isRequired,
  fixedRecurseStrategy: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  orgFilterQueryParams: PropTypes.object,
  asFormField: PropTypes.bool
}
OrganizationFilter.defaultProps = {
  asFormField: true
}

export const deserialize = (
  { queryKey, queryRecurseStrategyKey },
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
        const orgRecurseStrategy = query[queryRecurseStrategyKey]
        if (orgRecurseStrategy) {
          value.orgRecurseStrategy = orgRecurseStrategy
          toQueryValue[queryRecurseStrategyKey] = orgRecurseStrategy
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
