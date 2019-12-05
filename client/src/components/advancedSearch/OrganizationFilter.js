import API from "api"
import { gql } from "apollo-boost"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import _isEqualWith from "lodash/isEqualWith"
import { Organization } from "models"
import PropTypes from "prop-types"
import React, { useState, useEffect, useRef } from "react"
import { Checkbox } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import utils from "utils"

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
    onChange,
    queryKey,
    queryIncludeChildOrgsKey,
    orgFilterQueryParams
  } = props
  const latestValueProp = useRef(props.value)
  const valuePropUnchanged = _isEqualWith(
    latestValueProp.current,
    props.value,
    utils.treatFunctionsAsEqual
  )
  const [value, setValue] = useState(props.value || {})
  const [includeChildOrgs, setIncludeChildOrgs] = useState(
    props.value.includeChildOrgs || false
  )

  useEffect(() => {
    if (!valuePropUnchanged) {
      latestValueProp.current = props.value
      setValue(props.value)
      setIncludeChildOrgs(props.value.includeChildOrgs || false)
    }
    if (asFormField) {
      onChange({
        ...value,
        includeChildOrgs: includeChildOrgs,
        toQuery: () => ({
          [queryKey]: value.uuid,
          [queryIncludeChildOrgsKey]: includeChildOrgs
        })
      })
    }
  }, [
    asFormField,
    includeChildOrgs,
    onChange,
    props.value,
    queryIncludeChildOrgsKey,
    queryKey,
    value,
    valuePropUnchanged
  ])

  let msg = props.value.shortName
  if (msg && includeChildOrgs) {
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
        onChange={event => {
          if (typeof event === "object") {
            setValue(event)
          }
        }}
        value={value}
      />
      <Checkbox
        inline
        checked={includeChildOrgs}
        onChange={event => setIncludeChildOrgs(event.target.checked)}
      >
        Include sub-organizations
      </Checkbox>
    </div>
  )
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
  if (query[props.queryKey]) {
    return API.query(GQL_GET_ORGANIZATION, {
      uuid: query[props.queryKey]
    }).then(data => {
      if (data.organization) {
        const toQueryValue = {
          [props.queryKey]: query[props.queryKey]
        }
        if (query[props.queryIncludeChildOrgsKey]) {
          data.organization.includeChildOrgs =
            query[props.queryIncludeChildOrgsKey]
          toQueryValue[props.queryIncludeChildOrgsKey] =
            query[props.queryIncludeChildOrgsKey]
        }
        return {
          key: key,
          value: {
            ...data.organization,
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
