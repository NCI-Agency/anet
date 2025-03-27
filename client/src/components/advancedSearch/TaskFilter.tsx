import { gql } from "@apollo/client"
import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { TaskOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { AdvancedMultiSelectOverlayTable } from "components/advancedSelectWidget/AdvancedSelectOverlayTable"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import TaskTable from "components/TaskTable"
import { Task } from "models"
import pluralize from "pluralize"
import React, { useState } from "react"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      parentTask {
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
  }
`

const GQL_GET_TASKS = gql`
  query ($uuids: [String]) {
    tasks(uuids: $uuids) {
      uuid
      shortName
      parentTask {
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
  }
`

interface TaskFilterProps {
  queryKey: string
  queryRecurseStrategyKey: string
  fixedRecurseStrategy: string
  value?: any
  multi?: boolean
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
  multi,
  onChange,
  taskFilterQueryParams,
  ...advancedSelectProps
}: TaskFilterProps) => {
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

  const [expandedItems, setExpandedItems] = useState(new Set<string>())
  const [childrenMap, setChildrenMap] = useState(new Map<string, any[]>())

  const advancedSelectFilters = {
    all: {
      label: "All",
      queryVars: taskFilterQueryParams
    }
  }

  const parentKey = "parentTask"
  const valueKey = multi ? "uuid" : "shortName"

  const taskFields = `
    ${Task.autocompleteQuery}
    childrenTasks(query: { pageSize: 1 }) {
      uuid
    }
    parentTask {
      uuid
    }
    descendantTasks {
      uuid
    }
  `

  const HierarchicalOverlayTable = props => {
    const {
      items,
      valueKey: propsValueKey,
      selectedItems,
      handleAddItem,
      handleRemoveItem
    } = { ...props }
    const fetchChildren = async task => {
      const query = gql`
        query ($query: TaskSearchQueryInput) {
          taskList(query: $query) {
            list {
              uuid
              shortName
              longName
              parentTask {
                uuid
                shortName
                parentTask {
                  uuid
                }
              }
              ascendantTasks {
                uuid
                shortName
                parentTask {
                  uuid
                }
              }
              childrenTasks {
                uuid
                shortName
              }
              descendantTasks {
                uuid
              }
            }
          }
        }
      `
      const queryVars = { parentTaskUuid: task.uuid }
      const data = await API.query(query, { query: queryVars })
      return data.taskList.list
    }

    const handleExpand = task => {
      if (expandedItems.has(task.uuid)) {
        setExpandedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(task.uuid)
          return newSet
        })
      } else {
        if (!childrenMap.has(task.uuid)) {
          fetchChildren(task).then(children => {
            setChildrenMap(prev => new Map(prev).set(task.uuid, children))
            setExpandedItems(prev => new Set([...prev, task.uuid]))
          })
        } else {
          setExpandedItems(prev => new Set([...prev, task.uuid]))
        }
      }
    }

    const buildFlattenedList = (tasks, level = 0) => {
      return tasks.flatMap(task => {
        const isTaskSelected = selectedItems?.some(
          item => item[propsValueKey] === task[propsValueKey]
        )
        const isChildrenTaskSelected = selectedItems?.some(item =>
          task.descendantTasks?.some(child => child.uuid === item.uuid)
        )
        const isCollapsed = !expandedItems.has(task.uuid)
        const isSelected = isTaskSelected
          ? true
          : isChildrenTaskSelected && isCollapsed
            ? null
            : false
        const taskWithLevel = { ...task, level, isSelected }
        const children = expandedItems.has(task.uuid)
          ? childrenMap.get(task.uuid) || []
          : []
        return [taskWithLevel, ...buildFlattenedList(children, level + 1)]
      })
    }

    const topLevelItems = items.filter(task => !task.parentTask)
    const flattenedItems = buildFlattenedList(topLevelItems)

    const enhancedRenderRow = task => {
      const hasChildren = task.childrenTasks?.length > 0
      const isExpanded = expandedItems.has(task.uuid)
      const isSelected = selectedItems?.some(
        item => item[propsValueKey] === task[propsValueKey]
      )

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
              style={{ cursor: "pointer" }}
            >
              <Icon
                icon={
                  isExpanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT
                }
                size={IconSize.STANDARD}
                color="#5f6b7c"
              />
            </span>
          )}
          {hasChildren ? (
            <Icon
              icon={isExpanded ? IconNames.FOLDER_OPEN : IconNames.FOLDER_CLOSE}
              size={IconSize.STANDARD}
              color="#5f6b7c"
            />
          ) : (
            <Icon
              icon={IconNames.DOCUMENT}
              size={IconSize.STANDARD}
              color="#5f6b7c"
            />
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
        {...props}
        items={flattenedItems}
        renderRow={enhancedRenderRow}
      />
    )
  }

  const AdvancedSelectComponent = multi
    ? AdvancedMultiSelect
    : AdvancedSingleSelect
  return !asFormField ? (
    <>
      {multi
        ? value.value
          ?.map(v =>
            getBreadcrumbTrailAsText(
              v,
              v?.ascendantTasks,
              parentKey,
              "shortName"
            )
          )
          .join(" or ")
        : getBreadcrumbTrailAsText(
          value.value,
          value.value?.ascendantTasks,
          parentKey,
          valueKey
        )}
    </>
  ) : (
    <AdvancedSelectComponent
      {...advancedSelectProps}
      fieldName={queryKey}
      showRemoveButton={false}
      filterDefs={advancedSelectFilters}
      overlayColumns={["Name"]}
      overlayRenderRow={TaskOverlayRow}
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

export const TaskMultiFilter = ({ ...props }) => <TaskFilter {...props} multi />

export const deserialize = ({ queryKey }, query, key) => {
  if (query[queryKey]) {
    return API.query(GQL_GET_TASK, {
      uuid: query[queryKey]
    }).then(data => {
      if (data.task) {
        return {
          key,
          value: {
            value: data.task,
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
