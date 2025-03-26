import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { TaskOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import TaskTable from "components/TaskTable"
import { Task } from "models"
import pluralize from "pluralize"
import React from "react"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const GQL_GET_TASK = gql`
  query ($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const GQL_GET_TASKS = gql`
  query ($uuids: [String]) {
    tasks(uuids: $uuids) {
      uuid
      shortName
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

  const advancedSelectFilters = {
    all: {
      label: "All",
      queryVars: taskFilterQueryParams
    }
  }

  const parentKey = "parentTask"
  const valueKey = multi ? "uuid" : "shortName"
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
      objectType={Task}
      valueKey={valueKey}
      valueFunc={(v, k) =>
        getBreadcrumbTrailAsText(v, v?.ascendantTasks, parentKey, k)}
      fields={Task.autocompleteQuery}
      placeholder={`Filter by ${Settings.fields.task.shortLabel}…`}
      addon={TASKS_ICON}
      onChange={handleChangeTask}
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
