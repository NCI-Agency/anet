import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import { EventSeriesOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { EventSeries } from "models"
import React from "react"
import EVENTS_ICON from "resources/events.png"

const GQL_GET_EVENTSERIES = gql`
  query ($uuid: String) {
    eventSeries(uuid: $uuid) {
      uuid
      name
    }
  }
`

interface EventSeriesFilterProps {
  queryKey: string
  value?: any
  onChange?: (...args: unknown[]) => unknown
  eventSeriesFilterQueryParams?: any
  asFormField?: boolean
}

const EventSeriesFilter = ({
  asFormField = true,
  queryKey,
  value: inputValue,
  onChange,
  eventSeriesFilterQueryParams,
  ...advancedSelectProps
}: EventSeriesFilterProps) => {
  const defaultValue = {
    value: inputValue.value || {}
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value?.uuid
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
      queryVars: eventSeriesFilterQueryParams
    }
  }

  return !asFormField ? (
    <>{value.value?.name}</>
  ) : (
    <AdvancedSingleSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      fieldLabel={null}
      vertical
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={EventSeriesOverlayRow}
      objectType={EventSeries}
      valueKey="name"
      fields={EventSeries.autocompleteQuery}
      placeholder="Filter by event series…"
      addon={EVENTS_ICON}
      onChange={handleChangeEventSeries}
      value={value.value}
    />
  )

  function handleChangeEventSeries(event) {
    if (typeof event === "object") {
      setValue(prevValue => ({
        ...prevValue,
        value: event
      }))
    }
  }
}

export const deserialize = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_EVENTSERIES, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.eventSeries) {
        return {
          key,
          value: {
            value: data.eventSeries,
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

export default EventSeriesFilter
