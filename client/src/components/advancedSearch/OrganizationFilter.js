import API from "api"
import { gql } from "apollo-boost"
import useSearchFilter from "components/advancedSearch/hooks"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Checkbox } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const OrganizationFilter = props => {
  const {
    asFormField,
    queryKey,
    queryIncludeChildOrgsKey,
    orgFilterQueryParams
  } = props
  const defaultValue = {
    value: props.value.value || {},
    includeChildOrgs: props.value.includeChildOrgs || false
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value.uuid,
      [queryIncludeChildOrgsKey]: val.includeChildOrgs
    }
  }
  const [value, setValue] = useSearchFilter(props, defaultValue, toQuery)

  let msg = value.value.shortName
  if (msg && value.includeChildOrgs) {
    msg += ", including sub-organizations"
  }
  const advancedSelectProps = Object.without(
    props,
    "value",
    "queryKey",
    "queryIncludeChildOrgsKey",
    "orgFilterQueryParams",
    "asFormField"
  )
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
      <Checkbox
        inline
        checked={value.includeChildOrgs}
        onChange={handleChangeIncludeChildOrgs}
      >
        Include sub-organizations
      </Checkbox>
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

  function handleChangeIncludeChildOrgs(event) {
    const isChecked = event.target.checked // synthetic event outside async context
    setValue(prevValue => ({ ...prevValue, includeChildOrgs: isChecked }))
  }
}
OrganizationFilter.propTypes = {
  // An OrganizationFilter filter allows users to search the ANET database
  // for existing organizations and use that records ID as the search term.
  // If a position type has been selected, it will only search for organizations
  // of the related type.
  // The queryKey property tells this filter what property to set on the
  // search query (ie authorUuid, organizationUuid, etc).
  queryKey: PropTypes.string.isRequired,
  queryIncludeChildOrgsKey: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  orgFilterQueryParams: PropTypes.object,
  asFormField: PropTypes.bool
}
OrganizationFilter.defaultProps = {
  asFormField: true
}

export const deserializeOrganizationFilter = (props, query, key) => {
  const { queryKey, queryIncludeChildOrgsKey } = props
  if (query[queryKey]) {
    return API.query(GQL_GET_ORGANIZATION, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.organization) {
        const toQueryValue = {
          [queryKey]: query[queryKey]
        }
        const value = { value: data.organization }
        const includeChildOrgs = query[queryIncludeChildOrgsKey]
        if (includeChildOrgs) {
          value.includeChildOrgs = includeChildOrgs
          toQueryValue[queryIncludeChildOrgsKey] = includeChildOrgs
        }
        return {
          key: key,
          value: {
            ...value,
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

export default OrganizationFilter
