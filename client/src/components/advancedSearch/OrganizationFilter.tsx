import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { OrganizationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import { Organization } from "models"
import React from "react"
import ORGANIZATIONS_ICON from "resources/organizations.png"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
  }
`

const GQL_GET_ORGANIZATIONS = gql`
  query ($uuids: [String]) {
    organizations(uuids: $uuids) {
      uuid
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
  }
`

interface OrganizationFilterProps {
  queryKey: string
  queryRecurseStrategyKey: string
  fixedRecurseStrategy: string
  value?: any
  multi?: boolean
  onChange?: (...args: unknown[]) => unknown
  orgFilterQueryParams?: any
  asFormField?: boolean
}

const OrganizationFilter = ({
  asFormField = true,
  queryKey,
  queryRecurseStrategyKey,
  fixedRecurseStrategy,
  value: inputValue,
  multi,
  onChange,
  orgFilterQueryParams,
  ...advancedSelectProps
}: OrganizationFilterProps) => {
  const defaultValue = {
    value: inputValue.value || (multi ? [] : {})
  }
  const toQuery = val => {
    return {
      [queryKey]: multi ? val.value?.map(v => v.uuid) : val.value?.uuid,
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

  const AdvancedSelectComponent = multi
    ? AdvancedMultiSelect
    : AdvancedSingleSelect
  const valueKey = multi ? "uuid" : "shortName"
  return !asFormField ? (
    <>
      {multi
        ? value.value?.map(v => v.shortName).join(" or ")
        : value.value?.shortName}
    </>
  ) : (
    <AdvancedSelectComponent
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={OrganizationOverlayRow}
      objectType={Organization}
      valueKey={valueKey}
      fields={Organization.autocompleteQuery}
      placeholder="Filter by organization…"
      addon={ORGANIZATIONS_ICON}
      onChange={handleChangeOrg}
      value={value.value}
      renderSelected={
        <OrganizationTable
          organizations={value.value}
          noOrganizationsMessage="No organizations selected"
          showDelete
        />
      }
    />
  )

  function handleChangeOrg(event) {
    if (typeof event === "object" || Array.isArray(event)) {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }
}

export const OrganizationMultiFilter = ({ ...props }) => (
  <OrganizationFilter {...props} multi />
)

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

export const deserializeMulti = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_ORGANIZATIONS, {
      uuids: query[queryKey]
    }).then(data => {
      if (data.organizations) {
        return {
          key,
          value: {
            value: data.organizations,
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
