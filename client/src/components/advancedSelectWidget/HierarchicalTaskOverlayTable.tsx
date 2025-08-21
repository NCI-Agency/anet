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
import { Task } from "models"
import React, { useCallback, useEffect, useState } from "react"

export const taskFields = `
  ${Task.autocompleteQuery}
  ascendantTasks {
    uuid
    shortName
    longName
    parentTask {
      uuid
    }
    ascendantTasks {
      uuid
      shortName
      longName
      parentTask {
        uuid
      }
    }
  }
  descendantTasks {
    uuid
    shortName
    longName
    parentTask {
      uuid
    }
    ascendantTasks {
      uuid
      shortName
      longName
      parentTask {
        uuid
      }
    }
  }
`

const cursorStyle = {
  cursor: "pointer"
}

const sortTasks = tasks => {
  tasks
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
    .forEach(task => {
      if (!_isEmpty(task.children)) {
        sortTasks(task.children)
      }
    })
}

interface HierarchicalTaskOverlayTableProps {
  items: object[]
  restrictSelectableItems?: boolean
  multiSelect?: boolean
  selectedItems: object | object[]
  handleAddItem?: (...args: unknown[]) => unknown
  handleRemoveItem?: (...args: unknown[]) => unknown
}

export const HierarchicalTaskOverlayTable = ({
  items,
  restrictSelectableItems,
  multiSelect,
  selectedItems,
  handleAddItem,
  handleRemoveItem,
  ...otherProps
}: HierarchicalTaskOverlayTableProps) => {
  const [expandedItems, setExpandedItems] = useState(new Set<string>())
  const [rootTasks, setRootTasks] = useState<object[]>([])

  const handleExpand = useCallback(
    task => {
      if (expandedItems.has(task.uuid)) {
        setExpandedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(task.uuid)
          return newSet
        })
      } else {
        setExpandedItems(prev => new Set([...prev, task.uuid]))
      }
    },
    [expandedItems]
  )

  const enhancedRenderRow = useCallback(
    task => {
      const hasChildren = !_isEmpty(task.children)
      const isExpanded = expandedItems.has(task.uuid)
      const isSelected = getSelectedItemValue(
        multiSelect,
        selectedItems,
        task,
        compareItems
      )

      const handleToggleSelection = e => {
        e.stopPropagation()
        if (task.isNotSelectable) {
          return
        }
        if (isSelected) {
          handleRemoveItem(task)
        } else {
          handleAddItem(getEventWithoutExtraFields(task))
        }
      }

      const padding = Math.min(task.level, 3) * 20 + (hasChildren ? 0 : 26)
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
                handleExpand(task)
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
          {hasChildren ? (
            <Icon
              icon={isExpanded ? IconNames.FOLDER_OPEN : IconNames.FOLDER_CLOSE}
              size={IconSize.STANDARD}
            />
          ) : (
            <Icon icon={IconNames.DOCUMENT} size={IconSize.STANDARD} />
          )}
          <Icon icon={IconNames.STAR} size={12} />
          <span
            onClick={handleToggleSelection}
            style={{
              cursor: "pointer",
              flexGrow: "1"
            }}
          >
            <LinkTo
              modelType="Task"
              model={task}
              isLink={false}
              displayCallback={t =>
                t.longName ? `${t.shortName}: ${t.longName}` : t.shortName
              }
              style={cursorStyle}
            />
          </span>
        </div>
      )

      return (
        <React.Fragment key={task.uuid}>
          <td className="taskName" onClick={e => e.stopPropagation()}>
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
      items.flatMap(task => task.ascendantTasks?.map(t => t.uuid))
    )
    setExpandedItems(ascendantUuidSet.difference(uuidSet))
  }, [items])

  useEffect(() => {
    const treeMap = buildTree(
      "ascendantTasks",
      "descendantTasks",
      "parentTask",
      items
    )
    const topLevelTasks = Object.values(treeMap).filter(t =>
      _isEmpty(t.parents)
    )
    const topLevelTaskUuids = new Set<string>(topLevelTasks.map(t => t.uuid))
    const allTasksUuids = new Set<string>(items.map(t => t.uuid))
    const newRootTasks = items
      // Add the root locations directly included in the items
      .filter(t => topLevelTaskUuids.has(t.uuid))
      // Append the root locations not directly included in the items
      .concat(topLevelTasks.filter(t => !allTasksUuids.has(t.uuid)))
      .map(t => treeMap[t.uuid])
    setRootTasks(newRootTasks)
  }, [items])

  const flattenedItems = React.useMemo(() => {
    sortTasks(rootTasks)
    return buildFlattenedList(
      rootTasks,
      restrictSelectableItems ? items : null,
      multiSelect,
      selectedItems,
      expandedItems
    )
  }, [
    rootTasks,
    items,
    restrictSelectableItems,
    multiSelect,
    selectedItems,
    expandedItems
  ])

  const AdvancedSelectOverlayTableComponent =
    getAdvancedSelectOverlayTableComponent(multiSelect)
  return (
    <AdvancedSelectOverlayTableComponent
      {...otherProps}
      items={flattenedItems}
      selectedItems={selectedItems}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      renderRow={enhancedRenderRow}
    />
  )
}
