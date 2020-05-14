import { Settings } from "api"
import AggregationWidget from "components/AggregationWidget"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import PropTypes from "prop-types"
import React from "react"

const noTaskMessage = `No ${Settings.fields.task.subLevel.shortLabel}`
const noTask = {
  uuid: "-1",
  shortName: noTaskMessage,
  longName: noTaskMessage
}

// TODO: use it also in components/ReportsByTasks
const getReportsByTasks = reportsList => {
  const simplifiedValues = reportsList.map(d => {
    return { reportUuid: d.uuid, tasks: d.tasks.map(p => p.uuid) }
  })
  let tasks = reportsList.map(d => d.tasks)
  tasks = [].concat
    .apply([], tasks)
    .filter(
      (item, index, d) =>
        d.findIndex(t => {
          return t.uuid === item.uuid
        }) === index
    )
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
  // add No Task item, in order to relate to reports without Tasks
  tasks.push(noTask)
  return tasks.map(d => {
    const r = {}
    r.task = d
    r.reportsCount =
      d.uuid === noTask.uuid
        ? simplifiedValues.filter(item => item.tasks.length === 0).length
        : simplifiedValues.filter(item => item.tasks.indexOf(d.uuid) > -1)
          .length
    return r
  })
}

const ReportsByTaskAggregation = ({ fieldName, fieldConfig, data }) => {
  const values = getReportsByTasks(data)
  const aggWidgetProps = {
    widget: fieldConfig.aggregation?.widget || fieldConfig.widget,
    aggregationType: fieldConfig.aggregation?.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  return (
    <AggregationWidget
      key={`assessment-${fieldName}`}
      values={values}
      {...aggWidgetProps}
      {...fieldProps}
    />
  )
}
ReportsByTaskAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default ReportsByTaskAggregation
