import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  HierarchicalLocationOverlayTable,
  locationFields
} from "components/advancedSelectWidget/HierarchicalLocationOverlayTable"
import { handleChangeEvent } from "components/advancedSelectWidget/utils"
import LocationTable from "components/LocationTable"
import { Location } from "models"
import React from "react"
import LOCATIONS_ICON from "resources/locations.png"

const GQL_GET_LOCATIONS = gql`
  query ($uuids: [String]) {
    locations(uuids: $uuids) {
      ${locationFields}
    }
  }
`

interface LocationFilterProps {
  queryKey: string
  queryRecurseStrategyKey: string
  fixedRecurseStrategy: string
  value?: any
  onChange?: (...args: unknown[]) => unknown
  locFilterQueryParams?: any
  asFormField?: boolean
}

const LocationFilter = ({
  asFormField = true,
  queryKey,
  queryRecurseStrategyKey,
  fixedRecurseStrategy,
  value: inputValue,
  onChange,
  locFilterQueryParams,
  ...advancedSelectProps
}: LocationFilterProps) => {
  const defaultValue = {
    value: inputValue.value || []
  }
  const toQuery = val => {
    const query = {
      [queryKey]: val.value?.map(v => v?.uuid) ?? []
    }
    if (queryRecurseStrategyKey) {
      query[queryRecurseStrategyKey] = fixedRecurseStrategy
    }
    return query
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
      queryVars: locFilterQueryParams
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
      overlayTable={HierarchicalLocationOverlayTable}
      objectType={Location}
      valueKey="uuid"
      fields={locationFields}
      placeholder="Filter by location…"
      addon={LOCATIONS_ICON}
      onChange={event => handleChangeEvent(event, setValue)}
      pageSize={0}
      value={value.value}
      autoComplete="off"
      showDismiss
      renderSelected={
        <LocationTable
          locations={value.value}
          noLocationsMessage="No locations selected"
          showDelete
        />
      }
    />
  )
}

export const deserialize = ({ queryKey }, query, key) => {
  if (Object.hasOwn(query, queryKey)) {
    const emptyResult = { key, value: { toQuery: { [queryKey]: null } } }
    if (query[queryKey] == null) {
      return emptyResult
    }
    return API.query(GQL_GET_LOCATIONS, {
      uuids: query[queryKey]
    })
      .then(data => ({
        key,
        value: {
          value: data.locations?.filter(v => v != null) ?? [],
          toQuery: { ...query }
        }
      }))
      .catch(() => emptyResult)
  }
  return null
}

export default LocationFilter
