import { gql } from "@apollo/client"
import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import LocationTable from "components/LocationTable"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import React, { useCallback, useEffect, useState } from "react"
import LOCATIONS_ICON from "resources/locations.png"

const locationFields = `
  uuid
  name
  type
  ascendantLocations {
    uuid
    name
    parentLocations {
      uuid
    }
  }
  descendantLocations {
    uuid
    name
    parentLocations {
      uuid
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

const MAX_LOCATIONS_TO_SHOW = 300

function getItemFromMap(treeMap: object, item: object) {
  treeMap[item.uuid] ??= { uuid: item.uuid, name: item.name }
  return treeMap[item.uuid]
}

function addParentsToMapItem(
  treeMap: object,
  item: object,
  parents: object[] = []
) {
  return parents.map(parent => {
    const po = getItemFromMap(treeMap, parent)
    if (!item.parents) {
      item.parents = [po]
    } else if (!item.parents.some(p => p.uuid === po.uuid)) {
      item.parents.push(po)
    }
    return po
  })
}

function addChildrenToMapItem(
  treeMap: object,
  item: object,
  children: object[] = []
) {
  return children.map(child => {
    const co = getItemFromMap(treeMap, child)
    if (!item.children) {
      item.children = [co]
    } else if (!item.children.some(c => c.uuid === co.uuid)) {
      item.children.push(co)
    }
    return co
  })
}

function getChildren(
  item: object,
  descendants: object[],
  parentsField: string
) {
  return (
    descendants?.filter(d =>
      d[parentsField]?.map(p => p.uuid)?.includes(item.uuid)
    ) ?? []
  )
}

function setChildren(
  treeMap: object,
  item: object,
  descendants: object[],
  parentsField: string
) {
  const o = getItemFromMap(treeMap, item)
  const newChildren = getChildren(o, descendants, parentsField)
  for (const child of addChildrenToMapItem(treeMap, o, newChildren)) {
    addParentsToMapItem(treeMap, child, [o])
    setChildren(treeMap, child, descendants, parentsField)
  }
}

function getParents(item: object, ascendants: object[], parentsField: string) {
  const parentsUuids =
    ascendants
      ?.filter(a => a.uuid === item.uuid)
      .flatMap(a => a[parentsField])
      .map(p => p.uuid) ?? []
  return ascendants?.filter(a => parentsUuids.includes(a.uuid)) ?? []
}

function setParents(
  treeMap: object,
  item: object,
  ascendants: object[],
  parentsField: string
) {
  const o = getItemFromMap(treeMap, item)
  const newParents = getParents(o, ascendants, parentsField)
  for (const parent of addParentsToMapItem(treeMap, o, newParents)) {
    addChildrenToMapItem(treeMap, parent, [o])
    setParents(treeMap, parent, ascendants, parentsField)
  }
}

function buildTree(
  ascendantsField: string,
  descendantsField: string,
  parentsField: string,
  items: object[] = []
) {
  const treeMap = {}
  for (const item of items) {
    setChildren(treeMap, item, item[descendantsField], parentsField)
    setParents(treeMap, item, item[ascendantsField], parentsField)
  }
  return treeMap
}

function hasDescendantLocationSelected(item: object, location: object) {
  return location.children?.some(
    child =>
      child.uuid === item.uuid || hasDescendantLocationSelected(item, child)
  )
}

function hasAscendantLocationSelected(item: object, location: object) {
  return location.parents?.some(
    child =>
      child.uuid === item.uuid || hasAscendantLocationSelected(item, child)
  )
}

function buildFlattenedList(
  locations: object[],
  selectedItems: object[],
  expandedItems: Set<string>,
  level: number = 0
) {
  return (
    locations?.flatMap(location => {
      const isLocationSelected = selectedItems?.some(
        item => item.uuid === location.uuid
      )
      const isDescendantLocationSelected = selectedItems?.some(item =>
        hasDescendantLocationSelected(item, location)
      )
      const isAscendantLocationSelected = selectedItems?.some(item =>
        hasAscendantLocationSelected(item, location)
      )
      const isCollapsed = !expandedItems?.has(location.uuid)
      const isAscendantLocationSelectedAndCollapsed =
        isDescendantLocationSelected && isCollapsed ? null : false
      const isSelected =
        isLocationSelected || isAscendantLocationSelected
          ? true
          : isAscendantLocationSelectedAndCollapsed
      const disabled = isAscendantLocationSelected
      const locationWithLevel = { ...location, level, isSelected, disabled }
      const childrenWithLevel = isCollapsed
        ? []
        : buildFlattenedList(
          location.children,
          selectedItems,
          expandedItems,
          level + 1
        )
      return [locationWithLevel, ...childrenWithLevel]
    }) ?? []
  )
}

interface HierarchicalOverlayTableProps {
  items: object[]
  selectedItems: object[]
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
  const [rootLocations, setRootLocations] = useState<object[]>([])

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
      const hasChildren = !_isEmpty(location.children)
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
      handleExpand
    ]
  )

  useEffect(() => {
    if (!items?.length) {
      setExpandedItems(new Set())
      return
    }

    const uuidSet = new Set(items.map(item => item.uuid))
    const ascendantUuidSet = new Set(
      items.flatMap(location => location.ascendantLocations?.map(l => l.uuid))
    )
    setExpandedItems(ascendantUuidSet.difference(uuidSet))
  }, [items])

  useEffect(() => {
    const treeMap = buildTree(
      "ascendantLocations",
      "descendantLocations",
      "parentLocations",
      items
    )
    const topLevelLocations = Object.values(treeMap).filter(l =>
      _isEmpty(l.parents)
    )
    const topLevelLocationUuids = new Set<string>(
      topLevelLocations.map(l => l.uuid)
    )
    const allLocationsUuids = new Set<string>(items.map(l => l.uuid))
    const newRootLocations = items
      // Add the root locations directly included in the items
      .filter(l => topLevelLocationUuids.has(l.uuid))
      // Append the root locations not directly included in the items
      .concat(topLevelLocations.filter(l => !allLocationsUuids.has(l.uuid)))
      .map(l => treeMap[l.uuid])
    setRootLocations(newRootLocations)
  }, [items])

  const flattenedItems = React.useMemo(
    // limiting the number of locations to show in the overlay table
    () =>
      buildFlattenedList(
        rootLocations.slice(0, MAX_LOCATIONS_TO_SHOW),
        selectedItems,
        expandedItems
      ),
    [rootLocations, selectedItems, expandedItems]
  )

  return (
    <>
      {rootLocations.length > MAX_LOCATIONS_TO_SHOW && (
        <div className="text-center text-muted small fst-italic">
          Showing <span className="fw-semibold">{MAX_LOCATIONS_TO_SHOW}</span>{" "}
          results.
        </div>
      )}
      <AdvancedMultiSelectOverlayTable
        {...otherProps}
        items={flattenedItems}
        selectedItems={selectedItems}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        renderRow={enhancedRenderRow}
      />
    </>
  )
}

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
    return {
      [queryKey]: val.value?.map(v => v.uuid),
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

  return !asFormField ? (
    <>{value.value?.map(v => v.name).join(" or ")}</>
  ) : (
    <AdvancedMultiSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayTable={HierarchicalOverlayTable}
      objectType={Location}
      valueKey="uuid"
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

export const deserialize = ({ queryKey }, query, key) => {
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
