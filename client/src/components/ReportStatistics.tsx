import { gql } from "@apollo/client"
import API from "api"
import AggregationWidgetContainer, {
  AGGREGATION_TYPE,
  AGGREGATION_WIDGET_TYPE,
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import { CALENDAR_OBJECT_TYPES } from "components/aggregations/utils"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import PeriodsNavigation from "components/PeriodsNavigation"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import {
  formatPeriodBoundary,
  getPeriodsConfig,
  PeriodsDetailsPropType,
  PeriodsPropType,
  PeriodsTableHeader
} from "periodUtils"
import pluralize from "pluralize"
import React, { useEffect, useState } from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const choicesFactory = (values, labels, colors) => {
  const choices = {}
  Object.forEach(values, val => {
    choices[val] = { label: labels[val] }
    if (colors) {
      choices[val].color = colors[val]
    }
  })
  return choices
}

const REPORT_FIELDS_FOR_STATISTICS = {
  engagementDate: {
    type: CUSTOM_FIELD_TYPE.DATE
  },
  location: {
    aggregation: {
      widget: AGGREGATION_WIDGET_TYPE.REPORTS_MAP
    }
  },
  state: {
    type: CUSTOM_FIELD_TYPE.ENUM,
    choices: choicesFactory(
      Report.STATE,
      Report.STATE_LABELS,
      Report.STATE_COLORS
    )
  },
  engagementStatus: {
    type: CUSTOM_FIELD_TYPE.ENUMSET,
    choices: choicesFactory(
      Report.ENGAGEMENT_STATUS,
      Report.ENGAGEMENT_STATUS_LABELS
    )
  },
  tasks: {
    aggregation: {
      aggregationType: AGGREGATION_TYPE.REPORTS_BY_TASK,
      widget: AGGREGATION_WIDGET_TYPE.REPORTS_BY_TASK
    },
    label: pluralize(Settings.fields.task.shortLabel)
  },
  atmosphere: {
    type: CUSTOM_FIELD_TYPE.ENUM,
    label: Settings.fields.report.atmosphere?.label,
    choices: choicesFactory(Report.ATMOSPHERE, Report.ATMOSPHERE_LABELS)
  }
}

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        engagementDate
        location {
          uuid
          name
          lat
          lng
        }
        atmosphere
        state
        engagementStatus
        tasks {
          uuid
          shortName
        }
        customFields
      }
    }
  }
`

interface FieldStatisticsRowProps {
  idSuffix: string
  fieldConfig?: any
  fieldName?: string
  periods: PeriodsPropType
  periodsData: any[][]
  isFirstRow?: boolean
}

const FieldStatisticsRow = ({
  idSuffix,
  fieldConfig,
  fieldName,
  periods,
  periodsData,
  isFirstRow
}: FieldStatisticsRowProps) => {
  const aggregationWidget = getAggregationWidget(fieldConfig)
  if (_isEmpty(periods) || !aggregationWidget) {
    return null
  }
  return (
    <tr>
      {periods.map((period, index) => {
        const key = `${fieldName}-statistics-${formatPeriodBoundary(
          period.start
        )}`
        return (
          <td key={key}>
            {_isEmpty(periodsData[index]) ? (
              isFirstRow ? (
                <em>No reports found</em>
              ) : null
            ) : (
              <AggregationWidgetContainer
                key={key}
                fieldConfig={fieldConfig}
                fieldName={fieldName}
                data={periodsData[index]}
                dataType={CALENDAR_OBJECT_TYPES.REPORT}
                widget={aggregationWidget}
                period={period}
                widgetId={`${key}-${idSuffix}`}
              />
            )}
          </td>
        )
      })}
    </tr>
  )
}

interface NoStatisticsRowProps {
  periods: PeriodsPropType
}

const NoStatisticsRow = ({ periods }: NoStatisticsRowProps) => (
  <tr>
    {periods.map((period, index) => (
      <td key={index}>
        <em>No reports found</em>
      </td>
    ))}
  </tr>
)

interface ReportStatisticsProps {
  idSuffix: string
  pageDispatchers?: PageDispatchersPropType
  periodsDetails: PeriodsDetailsPropType
  setTotalCount?: (...args: unknown[]) => unknown
  queryParams?: any
}

const ReportStatistics = ({
  idSuffix,
  pageDispatchers,
  periodsDetails,
  setTotalCount,
  queryParams
}: ReportStatisticsProps) => {
  const [offset, setOffset] = useState(0)
  const { recurrence, numberOfPeriods } = periodsDetails
  const periodsConfig = getPeriodsConfig(recurrence, numberOfPeriods, offset)
  const { periods } = periodsConfig
  const dateSortAsc = datesArray => datesArray.sort((a, b) => a - b)
  const statisticsStartDate =
    !_isEmpty(periods) && dateSortAsc(periods.map(p => p.start))[0]
  const statisticsEndDate =
    !_isEmpty(periods) &&
    dateSortAsc(periods.map(p => p.end))[periods.length - 1]
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  if (
    statisticsStartDate &&
    (!queryParams.engagementDateStart ||
      queryParams.engagementDateStart < statisticsStartDate)
  ) {
    reportQuery.engagementDateStart = statisticsStartDate
  }
  if (
    statisticsEndDate &&
    (!queryParams.engagementDateEnd ||
      queryParams.engagementDateEnd > statisticsEndDate)
  ) {
    reportQuery.engagementDateEnd = statisticsEndDate
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }
  if (_isEmpty(periods)) {
    return null
  }

  const reports = data ? Report.fromArray(data.reportList.list) : []
  const CUSTOM_FIELDS_KEY = "customFieldsJson"
  const getPeriodData = (reports, dateRange) => {
    const reportsForDateRange = reports.filter(
      elem =>
        elem.engagementDate <= dateRange.end &&
        elem.engagementDate >= dateRange.start
    )
    reportsForDateRange.map(
      report =>
        (report[CUSTOM_FIELDS_KEY] = utils.parseJsonSafe(report.customFields))
    )
    return reportsForDateRange
  }
  const dataPerPeriod = []
  periods.forEach(period => dataPerPeriod.push(getPeriodData(reports, period)))
  const hasStatistics = !_isEmpty(dataPerPeriod.filter(data => !_isEmpty(data)))
  const customFieldsConfig = Settings.fields.report.customFields

  return (
    <>
      <PeriodsNavigation offset={offset} onChange={setOffset} />
      <Table
        responsive
        className="assessments-table"
        style={{ tableLayout: "fixed" }}
      >
        <PeriodsTableHeader periodsConfig={periodsConfig} />
        <tbody>
          <>
            {!hasStatistics && <NoStatisticsRow periods={periods} />}
            {hasStatistics &&
              Object.entries(REPORT_FIELDS_FOR_STATISTICS).map(
                ([key, field], index) => (
                  <FieldStatisticsRow
                    key={key}
                    idSuffix={`${key}-${idSuffix}`}
                    fieldName={key}
                    fieldConfig={field}
                    periods={periods}
                    periodsData={dataPerPeriod}
                    isFirstRow={index === 0}
                  />
                )
              )}
            {hasStatistics &&
              Object.entries(customFieldsConfig || {}).map(
                ([key, field], index) => (
                  <FieldStatisticsRow
                    key={key}
                    idSuffix={`${key}-${idSuffix}`}
                    fieldName={`${CUSTOM_FIELDS_KEY}.${key}`}
                    fieldConfig={field}
                    periods={periods}
                    periodsData={dataPerPeriod}
                    isFirstRow={
                      _isEmpty(REPORT_FIELDS_FOR_STATISTICS) && index === 0
                    }
                  />
                )
              )}
          </>
        </tbody>
      </Table>
    </>
  )
}

export default ReportStatistics
