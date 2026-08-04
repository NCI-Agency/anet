import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { TenantOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import Model from "components/Model"
import TenantTable from "components/TenantTable"
import { Tenant } from "models"
import React, { useContext } from "react"

const GQL_GET_TENANTS = gql`
  query ($uuids: [String]) {
    tenants(uuids: $uuids) {
      ${gqlEntityFieldsMap.Tenant}
    }
  }
`

interface TenantFilterProps {
  queryKey: string
  value?: any
  onChange?: (...args: unknown[]) => unknown
  asFormField?: boolean
}

const TenantFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  ...advancedSelectProps
}: TenantFilterProps) => {
  const { currentUser, allTenants } = useContext(AppContext)
  const defaultValue = {
    value:
      inputValue.value ??
      currentUser?.tenants?.filter(t => t.status === Model.STATUS.ACTIVE) ??
      []
  }
  const toQuery = val => ({
    [queryKey]: val.value?.map(v => v?.uuid).filter(v => v != null) ?? []
  })
  const [value, setValue] = useSearchFilter(
    asFormField,
    onChange,
    inputValue,
    defaultValue,
    toQuery
  )

  const advancedSelectFilters = {
    myTenants: {
      label: "My Tenants",
      list: currentUser?.tenants ?? []
    }
  }
  if (currentUser?.isAdmin()) {
    advancedSelectFilters.allTenants = {
      label: "All Tenants",
      list: allTenants ?? []
    }
  }

  return !asFormField ? (
    <>{value.value?.map(v => v.name).join(" or ")}</>
  ) : (
    <AdvancedMultiSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={TenantOverlayRow}
      objectType={Tenant}
      valueKey="uuid"
      fields={Tenant.autocompleteQuery}
      placeholder="Filter by tenant…"
      onChange={handleChange}
      value={value.value}
      showDismiss
      renderSelected={
        <TenantTable
          tenants={value.value}
          noTenantsMessage="No tenants selected"
          showDelete
        />
      }
    />
  )

  function handleChange(event) {
    if (typeof event === "object" || Array.isArray(event)) {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }
}

export const deserialize = ({ queryKey }, query, key) => {
  if (Object.hasOwn(query, queryKey)) {
    const emptyResult = { key, value: { toQuery: { [queryKey]: null } } }
    if (query[queryKey] == null) {
      return emptyResult
    }
    return API.query(GQL_GET_TENANTS, {
      uuids: query[queryKey]
    })
      .then(data => ({
        key,
        value: {
          value: data.tenants?.filter(v => v != null) ?? [],
          toQuery: { ...query }
        }
      }))
      .catch(() => emptyResult)
  }
  return null
}

export default TenantFilter
