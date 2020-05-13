import AggregationWidget from "components/AggregationWidget"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import _get from "lodash/get"
import { Report } from "models"
import {
  PeriodsConfigPropType,
  PeriodsPropType,
  PeriodsTableHeader
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { Table } from "react-bootstrap"

const REPORT_FIELDS_FOR_STATISTICS = {
  state: {
    aggregation: { widget: "default" },
    label: "State"
  },
  atmosphere: {
    aggregation: { widget: "default" },
    label: Settings.fields.report.atmosphere
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
        customFields
      }
    }
  }
`

const FieldStatisticsRow = ({
  fieldConfig,
  fieldKey,
  periods,
  periodsData
}) => {
  if (!fieldConfig.aggregation) {
    return null
  }
  const aggWidgetProps = {
    widget: fieldConfig.aggregation.widget || fieldConfig.widget,
    aggregationType: fieldConfig.aggregation.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          <AggregationWidget
            key={`statistics-${fieldKey}`}
            values={Object.get(periodsData[index], fieldKey)}
            {...aggWidgetProps}
            {...fieldProps}
          />
        </td>
      ))}
    </tr>
  )
}
FieldStatisticsRow.propTypes = {
  fieldConfig: PropTypes.object,
  fieldKey: PropTypes.string,
  periods: PeriodsPropType,
  periodsData: PropTypes.array
}

const ReportStatistics = ({
  pageDispatchers,
  periodsConfig,
  setTotalCount,
  queryParams
}) => {
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
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

  const customFieldsConfig = Settings.fields.report.customFields

  const getPeriodStatistics = (reports, dateRange) => {
    const reportsForDateRange = reports.filter(
      elem =>
        elem.engagementDate <= dateRange.end &&
        elem.engagementDate >= dateRange.start
    )
    reportsForDateRange.map(
      report => (report.customFieldsJson = JSON.parse(report.customFields))
    )
    const periodStatistics = {}
    reportsForDateRange.forEach(report => {
      const customFieldsValues = report.customFieldsJson
      if (customFieldsValues && typeof customFieldsValues === "object") {
        // TODO: make the key custom fields specific, to make sure we don't have both a normal as a custom field with the same name
        Object.keys(customFieldsConfig).forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(periodStatistics, key)) {
            periodStatistics[key] = []
          }
          periodStatistics[key].push(Object.get(customFieldsValues, key))
        })
      }
      // TODO: combine with above to reduce code duplication
      Object.keys(REPORT_FIELDS_FOR_STATISTICS).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(periodStatistics, key)) {
          periodStatistics[key] = []
        }
        periodStatistics[key].push(report[key])
      })
    })
    return periodStatistics
  }
  const { periods } = periodsConfig
  const periodsStatistics = []
  periodsConfig.periods.forEach(period =>
    periodsStatistics.push(getPeriodStatistics(reports, period))
  )

  return (
    <Table condensed responsive className="assessments-table">
      <PeriodsTableHeader periodsConfig={periodsConfig} />
      <tbody>
        <>
          {Object.keys(REPORT_FIELDS_FOR_STATISTICS || {}).map(key => (
            <FieldStatisticsRow
              key={key}
              fieldKey={key}
              fieldConfig={REPORT_FIELDS_FOR_STATISTICS[key]}
              periods={periods}
              periodsData={periodsStatistics}
            />
          ))}
          {Object.keys(customFieldsConfig || {}).map(key => (
            <FieldStatisticsRow
              key={key}
              fieldKey={key}
              fieldConfig={customFieldsConfig[key]}
              periods={periods}
              periodsData={periodsStatistics}
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
