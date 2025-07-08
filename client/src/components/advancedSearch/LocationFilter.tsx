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
    name
  }
  childrenLocations {
    uuid
    name
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
  const [flattenedItems, setFlattenedItems] = useState([])

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
            location.parentLocations?.some(child => child.uuid === item.uuid)
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
        const children = expandedItems.has(location.uuid)
          ? getChildren(location)
          : []
        return [locationWithLevel, ...buildFlattenedList(children, level + 1)]
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

    const neededLocations = [...items]
    const nonTopLevelItems = items.filter(location => location.parentLocations)
    nonTopLevelItems.forEach(location => {
      const missingLocations = location.parentLocations.filter(
        parent => !neededLocations.some(t => t.uuid === parent.uuid)
      )
      neededLocations.push(...missingLocations)
    })

    setLocationList(neededLocations)
    const newExpandedItems = new Set<string>()
    neededLocations.forEach(location => {
      if (!items.some(item => item.uuid === location.uuid)) {
        if (!newExpandedItems.has(location.uuid)) {
          newExpandedItems.add(location.uuid)
        }
      }
    })
    setExpandedItems(newExpandedItems)
  }, [items])

  useEffect(() => {
    setRootLocations(
      locationList.filter(location => !location?.parentLocations?.length)
    )
  }, [locationList])

  useEffect(() => {
    setFlattenedItems(buildFlattenedList(rootLocations))
  }, [rootLocations, buildFlattenedList])

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
