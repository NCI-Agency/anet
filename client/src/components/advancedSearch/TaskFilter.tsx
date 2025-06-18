import { gql } from "@apollo/client"
import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import TaskTable from "components/TaskTable"
import { Task } from "models"
import pluralize from "pluralize"
import React, { useEffect, useState } from "react"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const taskFields = `
  ${Task.autocompleteQuery}
  childrenTasks(query: { pageSize: 1 }) {
    uuid
  }
  ascendantTasks {
    uuid
    shortName
    longName
    parentTask {
      uuid
    }
    childrenTasks {
      uuid
    }
    descendantTasks {
      uuid
    }
    ascendantTasks {
      uuid
      shortName
      parentTask {
        uuid
      }
    }
  }
  descendantTasks {
    uuid
    shortName
  }
`

const GQL_GET_TASKS = gql`
  query ($uuids: [String]) {
    tasks(uuids: $uuids) {
      ${taskFields}
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
  const [taskList, setTaskList] = useState<any[]>([])
  const [rootTasks, setRootTasks] = useState<any[]>([])
  const [flattenedItems, setFlattenedItems] = useState([])

  const handleExpand = task => {
    if (expandedItems.has(task.uuid)) {
      setExpandedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(task.uuid)
        return newSet
      })
    } else {
      setExpandedItems(prev => new Set([...prev, task.uuid]))
    }
  }

  useEffect(() => {
    if (!items?.length) {
      setTaskList([])
      return
    }

    const neededTasks = [...items]
    const nonTopLevelItems = items.filter(task => task.parentTask)
    nonTopLevelItems.forEach(task => {
      const missingTasks = task.ascendantTasks.filter(
        ascendant => !neededTasks.some(t => t.uuid === ascendant.uuid)
      )
      neededTasks.push(...missingTasks)
    })

    setTaskList(neededTasks)
    const newExpandedItems = new Set<string>()
    neededTasks.forEach(task => {
      if (!items.some(item => item.uuid === task.uuid)) {
        if (!newExpandedItems.has(task.uuid)) {
          newExpandedItems.add(task.uuid)
        }
      }
    })
    setExpandedItems(newExpandedItems)
  }, [items, setTaskList, setExpandedItems])

  useEffect(() => {
    setRootTasks(taskList.filter(task => !task.parentTask))
  }, [taskList, setRootTasks])

  useEffect(() => {
    setFlattenedItems(buildFlattenedList(rootTasks))
  }, [rootTasks, selectedItems, expandedItems, setFlattenedItems])

  const getChildren = parentTask => {
    return (
      taskList?.filter(task => task?.parentTask?.uuid === parentTask.uuid) || []
    )
  }

  const buildFlattenedList = (tasks, level = 0) => {
    return tasks.flatMap(task => {
      const isTaskSelected = selectedItems?.some(
        item => item.uuid === task.uuid
      )
      const isDescendantTaskSelected = selectedItems?.some(item =>
        task.descendantTasks?.some(child => child.uuid === item.uuid)
      )
      const isAscendantTaskSelected = selectedItems
        ?.filter(item => item.uuid !== task.uuid)
        ?.some(item =>
          task.ascendantTasks?.some(child => child.uuid === item.uuid)
        )
      const isCollapsed = !expandedItems.has(task.uuid)
      const isDescendantTaskSelectedAndCollapsed =
        isDescendantTaskSelected && isCollapsed ? null : false
      const isSelected =
        isTaskSelected || isAscendantTaskSelected
          ? true
          : isDescendantTaskSelectedAndCollapsed
      const disabled = isAscendantTaskSelected
      const taskWithLevel = { ...task, level, isSelected, disabled }
      const children = expandedItems.has(task.uuid) ? getChildren(task) : []
      return [taskWithLevel, ...buildFlattenedList(children, level + 1)]
    })
  }

  const enhancedRenderRow = task => {
    const hasChildren = getChildren(task).length > 0
    const isExpanded = expandedItems.has(task.uuid)
    const isSelected = selectedItems?.some(item => item.uuid === task.uuid)

    const handleToggleSelection = e => {
      e.stopPropagation()
      if (isSelected) {
        handleRemoveItem(task)
      } else {
        handleAddItem(task)
      }
    }

    const displayLabel = task.longName
      ? `${task.shortName}: ${task.longName}`
      : task.shortName
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
          {displayLabel}
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
  }

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

interface TaskFilterProps {
  queryKey: string
  queryRecurseStrategyKey: string
  fixedRecurseStrategy: string
  value?: any
  onChange?: (...args: unknown[]) => unknown
  taskFilterQueryParams?: any
  asFormField?: boolean
}

const TaskFilter = ({
  asFormField = true,
  queryKey,
  queryRecurseStrategyKey,
  fixedRecurseStrategy,
  value: inputValue,
  onChange,
  taskFilterQueryParams,
  ...advancedSelectProps
}: TaskFilterProps) => {
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
      queryVars: taskFilterQueryParams
    }
  }

  const parentKey = "parentTask"
  const valueKey = "uuid"

  return !asFormField ? (
    <>
      {value.value
        ?.map(v =>
          getBreadcrumbTrailAsText(v, v?.ascendantTasks, parentKey, "shortName")
        )
        .join(" or ")}
    </>
  ) : (
    <AdvancedMultiSelect
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayTable={HierarchicalOverlayTable}
      objectType={Task}
      valueKey={valueKey}
      valueFunc={(v, k) => v.shortName}
      fields={taskFields}
      placeholder={`Filter by ${Settings.fields.task.shortLabel}…`}
      addon={TASKS_ICON}
      onChange={handleChangeTask}
      pageSize={0}
      value={value.value}
      autoComplete="off"
      showDismiss
      renderSelected={
        <TaskTable
          tasks={value.value}
          noTasksMessage={`No ${pluralize(Settings.fields.task.shortLabel)} selected`}
          showDelete
        />
      }
    />
  )

  function handleChangeTask(event) {
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
    return API.query(GQL_GET_TASKS, {
      uuids: query[queryKey]
    }).then(data => {
      if (data.tasks) {
        return {
          key,
          value: {
            value: data.tasks,
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

export default TaskFilter
