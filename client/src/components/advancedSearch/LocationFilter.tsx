import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LocationTable from "components/LocationTable"
import { Location } from "models"
import React from "react"
import LOCATIONS_ICON from "resources/locations.png"

const GQL_GET_LOCATION = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      type
    }
  }
`

const GQL_GET_LOCATIONS = gql`
  query ($uuids: [String]) {
    locations(uuids: $uuids) {
      uuid
      name
      type
    }
  }
`

interface LocationFilterProps {
  queryKey: string
  queryRecurseStrategyKey: string
  fixedRecurseStrategy: string
  value?: any
  multi?: boolean
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
  multi,
  onChange,
  locFilterQueryParams,
  ...advancedSelectProps
}: LocationFilterProps) => {
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
      queryVars: locFilterQueryParams
    }
  }

  const AdvancedSelectComponent = multi
    ? AdvancedMultiSelect
    : AdvancedSingleSelect
  const valueKey = multi ? "uuid" : "name"
  return !asFormField ? (
    <>
      {multi ? value.value?.map(v => v.name).join(" or ") : value.value?.name}
    </>
  ) : (
    <AdvancedSelectComponent
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={LocationOverlayRow}
      objectType={Location}
      valueKey={valueKey}
      fields={Location.autocompleteQuery}
      placeholder="Filter by location…"
      addon={LOCATIONS_ICON}
      onChange={handleChangeLoc}
      value={value.value}
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

  function handleChangeLoc(event) {
    if (typeof event === "object" || Array.isArray(event)) {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }
}

export const LocationMultiFilter = ({ ...props }) => (
  <LocationFilter {...props} multi />
)

export const deserialize = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_LOCATION, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.location) {
        return {
          key,
          value: {
            value: data.location,
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
    return API.query(GQL_GET_LOCATIONS, {
      uuids: query[queryKey]
    }).then(data => {
      if (data.locations) {
        return {
          key,
          value: {
            value: data.locations,
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

export default LocationFilter
