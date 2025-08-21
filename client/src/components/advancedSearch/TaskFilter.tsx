import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  HierarchicalTaskOverlayTable,
  taskFields
} from "components/advancedSelectWidget/HierarchicalTaskOverlayTable"
import { handleChangeEvent } from "components/advancedSelectWidget/utils"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import TaskTable from "components/TaskTable"
import { Task } from "models"
import pluralize from "pluralize"
import React from "react"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const GQL_GET_TASKS = gql`
  query ($uuids: [String]) {
    tasks(uuids: $uuids) {
      ${taskFields}
    }
  }
`

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
    const query = {
      [queryKey]: val.value?.map(v => v?.uuid) ?? []
    }
    if (queryRecurseStrategyKey) {
      query[queryRecurseStrategyKey] = fixedRecurseStrategy
    }
    return query
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
      overlayTable={HierarchicalTaskOverlayTable}
      objectType={Task}
      valueKey={valueKey}
      valueFunc={v => v.shortName}
      fields={taskFields}
      placeholder={`Filter by ${Settings.fields.task.shortLabel}…`}
      addon={TASKS_ICON}
      onChange={event => handleChangeEvent(event, setValue)}
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
}

export const deserialize = ({ queryKey }, query, key) => {
  if (Object.hasOwn(query, queryKey)) {
    const emptyResult = { key, value: { toQuery: { [queryKey]: null } } }
    if (query[queryKey] == null) {
      return emptyResult
    }
    return API.query(GQL_GET_TASKS, {
      uuids: query[queryKey]
    })
      .then(data => ({
        key,
        value: {
          value: data.tasks?.filter(v => v != null) ?? [],
          toQuery: { ...query }
        }
      }))
      .catch(() => emptyResult)
  }
  return null
}

export default TaskFilter
