import _clone from "lodash/clone"
import _isEmpty from "lodash/isEmpty"
import { Person, Report } from "models"
import moment from "moment"
import { AssessmentPeriodPropType, PeriodPropType } from "periodUtils"
import PropTypes from "prop-types"
import Settings from "settings"

export const aggregationWidgetPropTypes = {
  values: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.array,
        PropTypes.object
      ])
    )
  ]),
  valueType: PropTypes.string,
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string,
  vertical: PropTypes.bool,
  period: PropTypes.oneOfType([AssessmentPeriodPropType, PeriodPropType]),
  whenUnspecified: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}
export const aggregationWidgetDefaultProps = {
  whenUnspecified: null
}

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
// For now, used this list of colors: https://gist.github.com/mikebmou/1323655
const CHART_COLORS = [
  "#3366cc",
  "#dc3912",
  "#ff9900",
  "#109618",
  "#990099",
  "#0099c6",
  "#dd4477",
  "#66aa00",
  "#b82e2e",
  "#316395",
  "#3366cc",
  "#994499",
  "#22aa99",
  "#aaaa11",
  "#6633cc",
  "#e67300",
  "#8b0707",
  "#651067",
  "#329262",
  "#5574a6",
  "#3b3eac",
  "#b77322",
  "#16d620",
  "#b91383",
  "#f4359e",
  "#9c5935",
  "#a9c413",
  "#2a778d",
  "#668d1c",
  "#bea413",
  "#0c5922",
  "#743411"
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
        color: legend[key]?.color || legendColors.shift()
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

export const getReportsByTasks = reportsList => {
  if (_isEmpty(reportsList)) {
    return []
  }
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
  return tasks.map(d => ({
    task: d,
    reportsCount:
      d.uuid === noTask.uuid
        ? simplifiedValues.filter(item => _isEmpty(item.tasks)).length
        : simplifiedValues.filter(item => item.tasks.indexOf(d.uuid) > -1)
          .length
  }))
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

export const CALENDAR_OBJECT_TYPES = {
  REPORT: "Report"
}

export const GET_CALENDAR_EVENTS_FROM = {
  [CALENDAR_OBJECT_TYPES.REPORT]: reportsToEvents
}

export function reportsToEvents(reports) {
  return reports.map(r => {
    const who =
      (r.primaryAdvisor && new Person(r.primaryAdvisor).toString()) || ""
    const where =
      (r.principalOrg && r.principalOrg.shortName) ||
      (r.location && r.location.name) ||
      ""
    return {
      title: who + "@" + where,
      start: moment(r.engagementDate).format("YYYY-MM-DD HH:mm"),
      end: moment(r.engagementDate)
        .add(r.duration, "minutes")
        .format("YYYY-MM-DD HH:mm"),
      url: Report.pathFor(r),
      classNames: [`event-${Report.getStateForClassName(r)}`],
      extendedProps: { ...r },
      allDay: !Settings.engagementsIncludeTimeAndDuration || r.duration === null
    }
  })
}
