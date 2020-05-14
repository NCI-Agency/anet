/* eslint-disable */
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import ListAggregation from "components/aggregations/ListAggregation"
import ReportsByTaskAggregation from "components/aggregations/ReportsByTaskAggregation"
import _get from "lodash/get"
import { Report } from "models"
import pluralize from "pluralize"
import {
  PeriodsConfigPropType,
  PeriodsPropType,
  PeriodsTableHeader,
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { Table } from "react-bootstrap"

const REPORT_FIELDS_FOR_STATISTICS = {
  state: {
    aggregation: { widget: "default" },
    label: "State",
  },
  atmosphere: {
    aggregation: { widget: "default" },
    label: Settings.fields.report.atmosphere,
  },
  // TODO: right not the bar chart ends in an endless loop
  //  tasks: {
  //    aggregation: { widget: "reportsByTask" },
  //    label: pluralize(Settings.fields.task.subLevel.shortLabel)
  //  }
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

// TODO: Move this in a more general aggregations related file
const AGGREGATIONS = {
  likertScale: ListAggregation,
  numberAggregation: ListAggregation,
  reportsByTask: ReportsByTaskAggregation,
  default: ListAggregation,
}

const FieldStatisticsRow = ({
  fieldConfig,
  fieldName,
  periods,
  periodsData,
}) => {
  if (!fieldConfig.aggregation) {
    return null
  }
  const AggregationComponent =
    AGGREGATIONS[fieldConfig.aggregation.widget || fieldConfig.widget]
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          <AggregationComponent
            key={`statistics-${fieldName}`}
            fieldConfig={fieldConfig}
            fieldName={fieldName}
            data={periodsData[index]}
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
  periodsData: PropTypes.arrayOf(PropTypes.array),
}

const ReportStatistics = ({
  pageDispatchers,
  periodsConfig,
  setTotalCount,
  queryParams,
}) => {
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery,
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers,
  })
  // Update the total count
  const totalCount = done ? null : data?.reportList?.totalCount
  useEffect(() => setTotalCount && setTotalCount(totalCount), [
    setTotalCount,
    totalCount,
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
      report => (report[CUSTOM_FIELDS_KEY] = JSON.parse(report.customFields))
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
    <Table condensed responsive className="assessments-table">
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
  queryParams: PropTypes.object,
}

export default ReportStatistics
