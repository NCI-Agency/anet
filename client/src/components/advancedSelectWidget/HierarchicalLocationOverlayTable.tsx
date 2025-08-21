import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  buildFlattenedList,
  buildTree,
  compareItems,
  getAdvancedSelectOverlayTableComponent,
  getEventWithoutExtraFields,
  getSelectedItemValue
} from "components/advancedSelectWidget/utils"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import React, { useCallback, useEffect, useState } from "react"
import LOCATIONS_ICON from "resources/locations.png"

export const locationFields = `
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

const MAX_LOCATIONS_TO_SHOW = 300

const cursorStyle = {
  cursor: "pointer"
}

const sortLocations = locations => {
  locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(location => {
      if (!_isEmpty(location.children)) {
        sortLocations(location.children)
      }
    })
}

interface HierarchicalLocationOverlayTableProps {
  items: object[]
  restrictSelectableItems?: boolean
  multiSelect?: boolean
  selectedItems: object | object[]
  handleAddItem?: (...args: unknown[]) => unknown
  handleRemoveItem?: (...args: unknown[]) => unknown
}

export const HierarchicalLocationOverlayTable = ({
  items,
  restrictSelectableItems,
  multiSelect,
  selectedItems,
  handleAddItem,
  handleRemoveItem,
  ...otherProps
}: HierarchicalLocationOverlayTableProps) => {
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
      const isSelected = getSelectedItemValue(
        multiSelect,
        selectedItems,
        location,
        compareItems
      )

      const handleToggleSelection = e => {
        e.stopPropagation()
        if (location.isNotSelectable) {
          return
        }
        if (isSelected) {
          handleRemoveItem(location)
        } else {
          handleAddItem(getEventWithoutExtraFields(location))
        }
      }

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
            <LinkTo
              modelType="Location"
              model={location}
              isLink={false}
              displayCallback={l => l.name}
              style={cursorStyle}
            />
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
      multiSelect,
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
    () => {
      sortLocations(rootLocations)
      return buildFlattenedList(
        rootLocations.slice(0, MAX_LOCATIONS_TO_SHOW),
        restrictSelectableItems ? items : null,
        multiSelect,
        selectedItems,
        expandedItems
      )
    },
    [
      rootLocations,
      items,
      restrictSelectableItems,
      multiSelect,
      selectedItems,
      expandedItems
    ]
  )

  const AdvancedSelectOverlayTableComponent =
    getAdvancedSelectOverlayTableComponent(multiSelect)
  return (
    <>
      {rootLocations.length > MAX_LOCATIONS_TO_SHOW && (
        <div className="text-center text-muted small fst-italic">
          Showing <span className="fw-semibold">{MAX_LOCATIONS_TO_SHOW}</span>{" "}
          results.
        </div>
      )}
      <AdvancedSelectOverlayTableComponent
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
