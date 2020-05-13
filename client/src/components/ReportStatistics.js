import AggregationWidget from "components/AggregationWidget"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import { PeriodPropType, periodToString } from "components/assessments/utils"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Report } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import { Table } from "react-bootstrap"

// TODO
const PeriodsPropType = PropTypes.arrayOf(PeriodPropType)
const PeriodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  periods: PeriodsPropType
})

const STATISTICS_REPORT_FIELDS = {
  state: {
    aggregation: { widget: "default" },
    label: "state"
  },
  atmosphere: {
    aggregation: { widget: "default" },
    label: "atmosphere"
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
        duration
        keyOutcomes
        nextSteps
        cancelledReason
        atmosphere
        atmosphereDetails
        state
        author {
          uuid
          name
          rank
          role
        }
        primaryAdvisor {
          uuid
          name
          rank
          role
        }
        primaryPrincipal {
          uuid
          name
          rank
          role
        }
        advisorOrg {
          uuid
          shortName
        }
        principalOrg {
          uuid
          shortName
        }
        location {
          uuid
          name
          lat
          lng
        }
        tasks {
          uuid
          shortName
        }
        tags {
          uuid
          name
          description
        }
        updatedAt
        customFields
      }
    }
  }
`
// TODO:
const AssessmentsTableHeader = ({ periodsConfig }) => (
  <thead>
    <tr key="periods">
      <>
        {periodsConfig.periods.map(period => (
          <th key={period.start}>{periodToString(period)}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  periodsConfig: PeriodsConfigPropType
}

const FieldStatisticsRow = ({
  periodsData,
  fieldKey,
  fieldConfig,
  periods
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
  queryParams,
  setTotalCount,
  showAuthors,
  showStatus,
  periodsConfig
}) => {
  const { periods } = periodsConfig
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)

  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
    }
  }, [queryParams, queryParamsUnchanged])
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
      Object.keys(STATISTICS_REPORT_FIELDS).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(periodStatistics, key)) {
          periodStatistics[key] = []
        }
        periodStatistics[key].push(report[key])
      })
    })
    return periodStatistics
  }

  const periodsStatistics = []
  periodsConfig.periods.forEach(period =>
    periodsStatistics.push(getPeriodStatistics(reports, period))
  )
  return (
    <Table condensed responsive className="assessments-table">
      <AssessmentsTableHeader periodsConfig={periodsConfig} />
      <tbody>
        <>
          {Object.keys(STATISTICS_REPORT_FIELDS || {}).map(key => (
            <FieldStatisticsRow
              key={key}
              fieldKey={key}
              fieldConfig={STATISTICS_REPORT_FIELDS[key]}
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
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  showAuthors: PropTypes.bool,
  showStatus: PropTypes.bool,
  periodsConfig: PeriodsConfigPropType
}

export default ReportStatistics
