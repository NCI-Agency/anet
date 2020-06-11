import _clone from "lodash/clone"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import Settings from "settings"

export const countPerDateAggregation = (fieldName, fieldConfig, data) => {
  const values = data.reduce((counter, entity) => {
    const dateFieldValue = Object.get(entity, fieldName)
    const value = dateFieldValue
      ? moment(dateFieldValue).format("YYYY-MM-DD")
      : null
    counter[value] = ++counter[value] || 1
    return counter
  }, {})
  return { values: values }
}

// TODO: maybe use a library for a list of colors
const CHART_COLORS = [
  "#3366CC",
  "#DC3912",
  "#FF9900",
  "#109618",
  "#990099",
  "#3B3EAC",
  "#0099C6",
  "#DD4477",
  "#66AA00",
  "#B82E2E",
  "#316395",
  "#994499",
  "#22AA99",
  "#AAAA11",
  "#6633CC",
  "#E67300",
  "#8B0707",
  "#329262",
  "#5574A6",
  "#3B3EAC"
]
export const countPerValueAggregation = (fieldName, fieldConfig, data) => {
  const counters = data.reduce((counter, entity) => {
    const value = Object.get(entity, fieldName) || null
    const values = Array.isArray(value) ? value : [value]
    values.forEach(choice => (counter[choice] = ++counter[choice] || 1))
    return counter
  }, {})
  const legendColors = _clone(CHART_COLORS)
  const legend = fieldConfig?.choices || {}
  const legendKeys = !_isEmpty(legend)
    ? Object.keys(legend)
    : Object.keys(counters)
  legendKeys.forEach(
    key =>
      (legend[key] = {
        label: legend[key]?.label || key,
        color: legend[key]?.color || legendColors.pop()
      })
  )
  legend.null = { label: "Unspecified", color: "#bbbbbb" }
  return { values: counters, entitiesCount: data.length, legend: legend }
}

const arrayOfNumbers = arr =>
  arr.filter(n => !isNaN(parseFloat(n)) && isFinite(n)).map(n => Number(n))

export const numbersListAggregation = (fieldName, fieldConfig, data) => {
  const values = data.map(item => Object.get(item, fieldName))
  const numberValues = arrayOfNumbers(values)
  return { values: numberValues }
}

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

export const reportsByTaskAggregation = (fieldName, fieldConfig, data) => ({
  values: getReportsByTasks(data)
})

export const valuesListAggregation = (fieldName, fieldConfig, data) => ({
  values: data.map(item => Object.get(item, fieldName))
})

export const objectsListAggregation = (fieldName, fieldConfig, data) => ({
  values: data
})

export const countPerLevelAggregation = (fieldName, fieldConfig, data) => {
  const levels = fieldConfig.levels
  if (_isEmpty(levels)) {
    return null
  }
  const levelsEndValues = levels.map(level => level.endValue)
  levelsEndValues.sort((a, b) => a - b)
  const counters = data.reduce((counter, entity) => {
    const value = Object.get(entity, fieldName) || null
    const levelEndValue =
      value !== null
        ? levelsEndValues.filter(endVal => endVal >= value)[0]
        : null
    counter[levelEndValue] = ++counter[levelEndValue] || 1
    return counter
  }, {})
  const legend = levels.reduce((res, level) => {
    res[level.endValue] = level
    return res
  }, {})
  legend.null = { label: "Unspecified", color: "#bbbbbb" }
  return { values: counters, entitiesCount: data.length, legend: legend }
}

export const likertScaleAndPieAggregation = (fieldName, fieldConfig, data) => {
  return {
    values: {
      likertScaleValues: valuesListAggregation(fieldName, fieldConfig, data),
      pieValues: countPerLevelAggregation(fieldName, fieldConfig, data)
    }
  }
}
