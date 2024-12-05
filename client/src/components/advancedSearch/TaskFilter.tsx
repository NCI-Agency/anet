import { gql } from "@apollo/client"
import API from "api"
import useSearchFilter from "components/advancedSearch/hooks"
import { TaskOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import { Task } from "models"
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
    value: inputValue.value || {}
  }
  const toQuery = val => {
    return {
      [queryKey]: val.value?.uuid,
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
  const valueKey = "shortName"
  return !asFormField ? (
    <>
      {getBreadcrumbTrailAsText(
        value.value,
        value.value?.ascendantTasks,
        parentKey,
        valueKey
      )}
    </>
  ) : (
    <AdvancedSingleSelect
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
    />
  )

  function handleChangeTask(event) {
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

export default TaskFilter
