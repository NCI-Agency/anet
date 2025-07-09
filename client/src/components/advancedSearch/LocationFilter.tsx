import { gql } from "@apollo/client"
import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LocationTable from "components/LocationTable"
import { Location } from "models"
import React, { useCallback, useEffect, useState } from "react"
import LOCATIONS_ICON from "resources/locations.png"

const locationFields = `
  uuid
  name
  type
  parentLocations {
    uuid
  }
  childrenLocations {
    uuid
  }
  ascendantLocations {
    uuid
    name
    parentLocations {
      uuid
    }
    childrenLocations {
      uuid
    }
    ascendantLocations {
      uuid
    }
  }
  descendantLocations {
    uuid
    name
    parentLocations {
      uuid
    }
    childrenLocations {
      uuid
    }
    ascendantLocations {
      uuid
    }
  }
`

const GQL_GET_LOCATION = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      ${locationFields}
    }
  }
`

const GQL_GET_LOCATIONS = gql`
  query ($uuids: [String]) {
    locations(uuids: $uuids) {
      ${locationFields}
    }
  }
`

interface HierarchicalOverlayTableProps {
  items: any[]
  selectedItems: any[]
  handleAddItem?: (...args: unknown[]) => unknown
  handleRemoveItem?: (...args: unknown[]) => unknown
}

const HierarchicalOverlayTable = ({
  items,
  selectedItems,
  handleAddItem,
  handleRemoveItem,
  ...otherProps
}: HierarchicalOverlayTableProps) => {
  const [expandedItems, setExpandedItems] = useState(new Set<string>())
  const [locationList, setLocationList] = useState<any[]>([])
  const [rootLocations, setRootLocations] = useState<any[]>([])

  const getChildren = useCallback(
    parentLocation => {
      return (
        locationList?.filter(location =>
          location?.parentLocations?.some(
            parent => parent.uuid === parentLocation.uuid
          )
        ) || []
      )
    },
    [locationList]
  )

  const buildFlattenedList = useCallback(
    (locations, level = 0) => {
      return locations.flatMap(location => {
        const isLocationSelected = selectedItems?.some(
          item => item.uuid === location.uuid
        )
        const isDescendantLocationSelected = selectedItems?.some(item =>
          location.childrenLocations?.some(child => child.uuid === item.uuid)
        )
        const isAscendantLocationSelected = selectedItems
          ?.filter(item => item.uuid !== location.uuid)
          ?.some(item =>
            location.ascendantLocations?.some(child => child.uuid === item.uuid)
          )
        const isCollapsed = !expandedItems.has(location.uuid)
        const isDescendantLocationSelectedAndCollapsed =
          isDescendantLocationSelected && isCollapsed ? null : false
        const isSelected =
          isLocationSelected || isAscendantLocationSelected
            ? true
            : isDescendantLocationSelectedAndCollapsed
        const disabled = isAscendantLocationSelected
        const locationWithLevel = { ...location, level, isSelected, disabled }
        const childrenWithLevel = expandedItems.has(location.uuid)
          ? buildFlattenedList(getChildren(location), level + 1)
          : []
        return [locationWithLevel, ...childrenWithLevel]
      })
    },
    [selectedItems, expandedItems, getChildren]
  )

  const handleExpand = useCallback(
    location => {
      if (expandedItems.has(location.uuid)) {
        setExpandedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(location.uuid)
          return newSet
        })
      } else {
        setExpandedItems(prev => new Set([...prev, location.uuid]))
      }
    },
    [expandedItems]
  )

  const enhancedRenderRow = useCallback(
    location => {
      const hasChildren = getChildren(location).length > 0
      const isExpanded = expandedItems.has(location.uuid)
      const isSelected = selectedItems?.some(
        item => item.uuid === location.uuid
      )

      const handleToggleSelection = e => {
        e.stopPropagation()
        if (isSelected) {
          handleRemoveItem(location)
        } else {
          handleAddItem(location)
        }
      }

      const displayLabel = location.name
      const padding = Math.min(location.level, 3) * 20 + (hasChildren ? 0 : 26)
      const indentedLabel = (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: padding,
            gap: 10,
            cursor: "auto"
          }}
        >
          {hasChildren && (
            <span
              onClick={e => {
                e.stopPropagation()
                handleExpand(location)
              }}
              style={{ cursor: "pointer", pointerEvents: "all" }}
            >
              <Icon
                icon={
                  isExpanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT
                }
                size={IconSize.STANDARD}
              />
            </span>
          )}
          <img src={LOCATIONS_ICON} style={{ width: 16 }} />
          <span
            onClick={handleToggleSelection}
            style={{
              cursor: "pointer",
              flexGrow: "1"
            }}
          >
            {displayLabel}
          </span>
        </div>
      )

      return (
        <React.Fragment key={location.uuid}>
          <td className="locationName" onClick={e => e.stopPropagation()}>
            {indentedLabel}
          </td>
        </React.Fragment>
      )
    },
    [
      expandedItems,
      selectedItems,
      handleAddItem,
      handleRemoveItem,
      getChildren,
      handleExpand
    ]
  )

  useEffect(() => {
    if (!items?.length) {
      setLocationList([])
      return
    }

    const uuidSet = new Set(items.map(item => item.uuid))
    const neededLocationsMap = new Map(items.map(item => [item.uuid, item]))

    // Add all parent locations for non-top-level items
    const queue = [...items]
    while (queue.length > 0) {
      const location = queue.shift()
      if (location?.ascendantLocations?.length) {
        for (const ascendant of location.ascendantLocations) {
          if (!neededLocationsMap.has(ascendant.uuid)) {
            neededLocationsMap.set(ascendant.uuid, ascendant)
          }
        }
      }
    }

    // Add all descendants for top-level locations
    for (const location of neededLocationsMap.values()) {
      if (!location.parentLocations?.length && location.descendantLocations) {
        for (const descendant of location.descendantLocations) {
          if (!neededLocationsMap.has(descendant.uuid)) {
            neededLocationsMap.set(descendant.uuid, descendant)
          }
        }
      }
    }

    const neededLocations = Array.from(neededLocationsMap.values())
    // Build the newExpandedItems set
    // (locations that are not in the original items, but lead to them)
    const checkAscendants = (
      location,
      uuidSet,
      newExpandedItems,
      neededLocations
    ) => {
      for (const ascendant of location?.ascendantLocations) {
        if (ascendant.uuid === location.uuid) {
          continue
        }
        const ascedantLocation = neededLocations.find(
          location => location.uuid === ascendant.uuid
        )
        if (!uuidSet.has(ascendant.uuid)) {
          newExpandedItems.add(ascendant.uuid)
        }
        checkAscendants(
          ascedantLocation,
          uuidSet,
          newExpandedItems,
          neededLocations
        )
      }
    }
    const newExpandedItems = new Set<string>()
    for (const item of items) {
      checkAscendants(item, uuidSet, newExpandedItems, neededLocations)
    }

    setExpandedItems(newExpandedItems)
    setLocationList(neededLocations)
  }, [items])

  useEffect(() => {
    setRootLocations(
      locationList.filter(location => !location?.parentLocations?.length)
    )
  }, [locationList])

  const flattenedItems = React.useMemo(
    () => buildFlattenedList(rootLocations),
    [rootLocations, buildFlattenedList]
  )

  return (
    <AdvancedMultiSelectOverlayTable
      {...otherProps}
      items={flattenedItems}
      selectedItems={selectedItems}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      renderRow={enhancedRenderRow}
    />
  )
}

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
      overlayTable={HierarchicalOverlayTable}
      objectType={Location}
      valueKey={valueKey}
      fields={locationFields}
      placeholder="Filter by location…"
      addon={LOCATIONS_ICON}
      onChange={handleChangeLoc}
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
