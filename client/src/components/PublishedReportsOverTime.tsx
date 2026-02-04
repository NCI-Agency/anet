import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import BarChart from "components/BarChart"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import {
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import _escape from "lodash/escape"
import { Report } from "models"
import moment from "moment"
import React, { useMemo, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { useResizeDetector } from "react-resize-detector"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        state
        releasedAt
      }
    }
  }
`

const BAR_WIDTH_MONTHLY = 44
const BAR_WIDTH_WEEKLY = 28
const BAR_HEIGHT = 320
const GRANULARITY = {
  MONTH: "month",
  WEEK: "week"
}

interface PublishedReportsOverTimeProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PublishedReportsOverTime = ({
  pageDispatchers,
  queryParams
}: PublishedReportsOverTimeProps) => {
  const [granularity, setGranularity] = useState(GRANULARITY.MONTH)
  const [yearOffset, setYearOffset] = useState(0)
  usePageTitle("Reports Published Over Time")

  const { width, ref } = useResizeDetector()
  const yearStart = useMemo(
    () => moment().subtract(yearOffset, "year").startOf("year"),
    [yearOffset]
  )
  const displayEnd = useMemo(() => {
    if (yearOffset === 0) {
      return moment().endOf("day")
    }
    return yearStart.clone().endOf("year")
  }, [yearOffset, yearStart])
  const reportQuery = useMemo(
    () => ({
      ...(queryParams || {}),
      pageSize: 0,
      state: [Report.STATE.PUBLISHED],
      releasedAtStart: yearStart,
      releasedAtEnd: displayEnd
    }),
    [queryParams, yearStart, displayEnd]
  )

  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  const graphData = useMemo(() => {
    if (!data) {
      return []
    }
    const reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    const periods =
      granularity === GRANULARITY.MONTH
        ? buildMonthlyPeriods(yearStart, displayEnd)
        : buildWeeklyPeriods(yearStart, displayEnd)
    const counts = reportsList.reduce((acc, report) => {
      if (!report.releasedAt) {
        return acc
      }
      const releasedAt = moment(report.releasedAt)
      const key =
        granularity === GRANULARITY.MONTH
          ? releasedAt.format("YYYY-MM")
          : getWeekKey(releasedAt, yearStart)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return periods.map(period => ({
      ...period,
      reportsCount: counts[period.periodKey] || 0
    }))
  }, [data, granularity, yearStart, displayEnd])

  if (done) {
    return result
  }

  const displayedYear = yearStart.year()
  const totalReports = graphData.reduce(
    (total, period) => total + period.reportsCount,
    0
  )
  const minBarWidth =
    granularity === GRANULARITY.MONTH ? BAR_WIDTH_MONTHLY : BAR_WIDTH_WEEKLY
  const chartWidth = Math.max(width || 0, graphData.length * minBarWidth)
  const hasData = graphData.length > 0
  const updateYearOffset = nextOffset => {
    setYearOffset(Math.max(0, nextOffset))
  }

  return (
    <div className="scrollable-y">
      <div className="p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => updateYearOffset(yearOffset + 1)}
            >
              <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} /> previous year
            </Button>
            <div className="fw-semibold">Year {displayedYear}</div>
            <Button
              variant="outline-secondary"
              disabled={yearOffset === 0}
              onClick={() => updateYearOffset(yearOffset - 1)}
            >
              next year <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
            </Button>
          </div>
          <ButtonToggleGroup value={granularity} onChange={setGranularity}>
            <Button value={GRANULARITY.MONTH} variant="outline-secondary">
              Monthly
            </Button>
            <Button value={GRANULARITY.WEEK} variant="outline-secondary">
              Weekly
            </Button>
          </ButtonToggleGroup>
        </div>

        <div className="mb-3">
          <div className="fw-semibold">
            Total published reports: {totalReports}
          </div>
        </div>

        {hasData ? (
          <>
            <div ref={ref} style={{ overflowX: "auto" }}>
              <BarChart
                width={chartWidth}
                height={BAR_HEIGHT}
                chartId="reports_published_over_time"
                data={graphData}
                xProp="periodKey"
                yProp="reportsCount"
                xLabel="label"
                tooltip={d => `
                  <h4>${_escape(d.label)}</h4>
                  <p>${_escape(d.periodRange)}</p>
                  <p>${_escape(d.reportsCount)}</p>
                `}
              />
            </div>

            <div className="mt-4">
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="text-end">Published reports</th>
                  </tr>
                </thead>
                <tbody>
                  {graphData.map(period => (
                    <tr key={period.periodKey}>
                      <td>{period.periodRange}</td>
                      <td className="text-end">{period.reportsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <em>No published reports found for {displayedYear}.</em>
        )}
      </div>
    </div>
  )
}

const buildMonthlyPeriods = (yearStart, displayEnd) => {
  const totalMonths = displayEnd.diff(yearStart, "months") + 1
  return Array.from({ length: totalMonths }, (_, index) => {
    const start = yearStart.clone().add(index, "month").startOf("month")
    let end = start.clone().endOf("month")
    if (end.isAfter(displayEnd)) {
      end = displayEnd.clone()
    }
    return {
      periodKey: start.format("YYYY-MM"),
      label: start.format("MMM"),
      periodRange: `${start.format("MMM D")} - ${end.format("MMM D")}`
    }
  })
}

const buildWeeklyPeriods = (yearStart, displayEnd) => {
  const totalWeeks = displayEnd.diff(yearStart, "weeks") + 1
  return Array.from({ length: totalWeeks }, (_, index) => {
    const start = yearStart.clone().add(index, "weeks").startOf("day")
    let end = start.clone().add(6, "days").endOf("day")
    if (end.isAfter(displayEnd)) {
      end = displayEnd.clone()
    }
    const weekLabel = String(index + 1).padStart(2, "0")
    return {
      periodKey: `W${weekLabel}`,
      label: `W${weekLabel}`,
      periodRange: `${start.format("MMM D")} - ${end.format("MMM D")}`
    }
  })
}

const getWeekKey = (releasedAt, yearStart) => {
  const weekIndex = releasedAt.diff(yearStart, "weeks")
  const weekLabel = String(weekIndex + 1).padStart(2, "0")
  return `W${weekLabel}`
}

export default PublishedReportsOverTime
