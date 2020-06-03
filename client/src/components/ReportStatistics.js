import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AggregationWidgetContainer, {
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import _get from "lodash/get"
import { Report } from "models"
import {
  PeriodsConfigPropType,
  PeriodsPropType,
  PeriodsTableHeader
} from "periodUtils"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { Table } from "react-bootstrap"
import utils from "utils"

const REPORT_FIELDS_FOR_STATISTICS = {
  state: {
    aggregation: { aggregationType: "countPerValue", widget: "pie" },
    label: "State",
    choices: {
      [Report.STATE.DRAFT]: {
        label: Report.STATE_LABELS[Report.STATE.DRAFT],
        color: "#bdbdaf"
      },
      [Report.STATE.PENDING_APPROVAL]: {
        label: Report.STATE_LABELS[Report.STATE.PENDING_APPROVAL],
        color: "#848478"
      },
      [Report.STATE.APPROVED]: {
        label: Report.STATE_LABELS[Report.STATE.APPROVED],
        color: "#75eb75"
      },
      [Report.STATE.PUBLISHED]: {
        label: Report.STATE_LABELS[Report.STATE.PUBLISHED],
        color: "#5cb85c"
      },
      [Report.STATE.CANCELLED]: {
        label: Report.STATE_LABELS[Report.STATE.CANCELLED],
        color: "#ec971f"
      },
      [Report.STATE.REJECTED]: {
        label: Report.STATE_LABELS[Report.STATE.REJECTED],
        color: "#c23030"
      }
    }
  },
  atmosphere: {
    aggregation: { aggregationType: "countPerValue", widget: "pie" },
    label: Settings.fields.report.atmosphere
  },
  tasks: {
    aggregation: {
      aggregationType: "countReportsByTask",
      widget: "reportsByTask"
    },
    label: pluralize(Settings.fields.task.subLevel.shortLabel)
  }
}

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        intent
        engagementDate
        atmosphere
        state
        tasks {
          uuid
          shortName
        }
        customFields
      }
    }
  }
`

const FieldStatisticsRow = ({
  fieldConfig,
  fieldName,
  periods,
  periodsData
}) => {
  const aggregationWidget = getAggregationWidget(fieldConfig)
  if (!aggregationWidget) {
    return null
  }
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          <AggregationWidgetContainer
            key={`statistics-${fieldName}`}
            fieldConfig={fieldConfig}
            fieldName={fieldName}
            data={periodsData[index]}
            widget={aggregationWidget}
            period={period}
          />
        </td>
      ))}
    </tr>
  )
}
FieldStatisticsRow.propTypes = {
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string,
  periods: PeriodsPropType,
  periodsData: PropTypes.arrayOf(PropTypes.array)
}

const ReportStatistics = ({
  pageDispatchers,
  periodsConfig,
  setTotalCount,
  queryParams
}) => {
  const dateSortAsc = datesArray => datesArray.sort((a, b) => a - b)
  const statisticsStartDate = dateSortAsc(
    periodsConfig.periods.map(p => p.start)
  )[0]
  const statisticsEndDate = dateSortAsc(periodsConfig.periods.map(p => p.end))[
    periodsConfig.periods.length - 1
  ]
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  if (
    !queryParams.engagementDateStart ||
    queryParams.engagementDateStart < statisticsStartDate
  ) {
    reportQuery.engagementDateStart = statisticsStartDate
  }
  if (
    !queryParams.engagementDateEnd ||
    queryParams.engagementDateEnd > statisticsEndDate
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
  useEffect(() => setTotalCount && setTotalCount(totalCount), [
    setTotalCount,
    totalCount
  ])
  if (done) {
    return result
  }

  const reports = data ? Report.fromArray(data.reportList.list) : []
  if (_get(reports, "length", 0) === 0) {
    return <em>No reports found</em>
  }
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
  const { periods } = periodsConfig
  const dataPerPeriod = []
  periodsConfig.periods.forEach(period =>
    dataPerPeriod.push(getPeriodData(reports, period))
  )

  const customFieldsConfig = Settings.fields.report.customFields

  return (
    <Table
      condensed
      responsive
      className="assessments-table"
      style={{ tableLayout: "fixed" }}
    >
      <PeriodsTableHeader periodsConfig={periodsConfig} />
      <tbody>
        <>
          {Object.keys(REPORT_FIELDS_FOR_STATISTICS || {}).map(key => (
            <FieldStatisticsRow
              key={key}
              fieldName={key}
              fieldConfig={REPORT_FIELDS_FOR_STATISTICS[key]}
              periods={periods}
              periodsData={dataPerPeriod}
            />
          ))}
          {Object.keys(customFieldsConfig || {}).map(key => (
            <FieldStatisticsRow
              key={key}
              fieldName={`${CUSTOM_FIELDS_KEY}.${key}`}
              fieldConfig={customFieldsConfig[key]}
              periods={periods}
              periodsData={dataPerPeriod}
            />
          ))}
        </>
      </tbody>
    </Table>
  )
}

ReportStatistics.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  periodsConfig: PeriodsConfigPropType,
  setTotalCount: PropTypes.func,
  queryParams: PropTypes.object
}

export default ReportStatistics
