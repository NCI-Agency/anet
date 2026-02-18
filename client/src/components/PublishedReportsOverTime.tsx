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
import moment from "moment"
import { WEEK_PERIOD_FORMAT, WEEK_PERIOD_KEY } from "periodUtils"
import React, { useEffect, useMemo, useState } from "react"
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

const BAR_HEIGHT = 320
const GRANULARITY = {
  MONTH: "month",
  WEEK: "week"
}

// Helper to resolve various date value types to a moment object
function resolveDateValue(value) {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "number") {
    return moment().add(value, "milliseconds")
  }
  return moment(value)
}

interface PublishedReportsOverTimeProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setQueryParams?: (...args: unknown[]) => unknown
}

const PublishedReportsOverTime = ({
  pageDispatchers,
  queryParams,
  setQueryParams
}: PublishedReportsOverTimeProps) => {
  const [granularity, setGranularity] = useState(GRANULARITY.MONTH)
  usePageTitle("Reports Published Over Time")

  const { width, ref } = useResizeDetector()
  const rangeStart = useMemo(
    () => resolveDateValue(queryParams?.releasedAtStart),
    [queryParams?.releasedAtStart]
  )
  const rangeEnd = useMemo(
    () => resolveDateValue(queryParams?.releasedAtEnd),
    [queryParams?.releasedAtEnd]
  )
  const todayEnd = moment().endOf("day")
  const displayRangeEnd =
    rangeEnd && rangeEnd.isAfter(todayEnd) ? todayEnd : rangeEnd
  const hasRange = Boolean(
    rangeStart && displayRangeEnd && rangeStart.isSameOrBefore(displayRangeEnd)
  )
  const reportQuery = useMemo(
    () => ({
      ...queryParams,
      pageSize: 0
    }),
    [queryParams]
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
    if (!data || !hasRange) {
      return []
    }
    const reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    const periods =
      granularity === GRANULARITY.MONTH
        ? buildMonthlyPeriods(rangeStart, displayRangeEnd)
        : buildWeeklyPeriods(rangeStart, displayRangeEnd)
    const counts = reportsList.reduce((acc, report) => {
      if (!report.releasedAt) {
        return acc
      }
      const releasedAt = moment(report.releasedAt)
      const key =
        granularity === GRANULARITY.MONTH
          ? releasedAt.format("YYYY-MM")
          : getWeekKey(releasedAt)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return periods.map(period => ({
      ...period,
      reportsCount: counts[period.periodKey] || 0
    }))
  }, [data, displayRangeEnd, granularity, hasRange, rangeStart])

  const displayedRangeLabel =
    hasRange && rangeStart.year() === displayRangeEnd.year()
      ? `Year ${rangeStart.year()}`
      : hasRange
        ? `${rangeStart.format("YYYY")}–${displayRangeEnd.format("YYYY")}`
        : "Release Date range"
  const totalReports = graphData.reduce(
    (total, period) => total + period.reportsCount,
    0
  )
  const chartWidth = width || 0
  const barPadding = 0.1
  const hasData = graphData.length > 0
  const rangeStartOfYear = moment(rangeStart).startOf("year")
  const isCurrentYearClampedRange =
    hasRange &&
    rangeStart.isSame(rangeStartOfYear, "day") &&
    displayRangeEnd.isSame(todayEnd, "day") &&
    rangeStart.isSame(todayEnd, "year")
  const isFullYearRange =
    hasRange &&
    rangeStart.isSame(rangeStartOfYear, "day") &&
    displayRangeEnd.isSame(moment(displayRangeEnd).endOf("year"), "day")
  const getShiftedRange = direction => {
    if (!hasRange) {
      return null
    }
    let nextStart = moment(rangeStart).add(direction, "year")
    let nextEnd = moment(displayRangeEnd).add(direction, "year")
    if (direction < 0 && isCurrentYearClampedRange) {
      nextStart = nextStart.startOf("year")
      nextEnd = moment(nextStart).endOf("year")
    } else if (direction > 0 && isFullYearRange) {
      nextStart = nextStart.startOf("year")
      if (nextStart.isSame(todayEnd, "year")) {
        nextEnd = moment(todayEnd)
      } else {
        nextEnd = moment(nextStart).endOf("year")
      }
    } else if (direction > 0 && nextEnd.isAfter(todayEnd)) {
      nextEnd = moment(todayEnd)
    }
    if (direction > 0 && nextStart.isAfter(todayEnd, "day")) {
      return null
    }
    return { start: nextStart, end: nextEnd }
  }

  const canGoNext = Boolean(getShiftedRange(1))
  const canGoPrevious = Boolean(getShiftedRange(-1))
  useEffect(() => {
    if (!rangeEnd || !rangeEnd.isAfter(todayEnd)) {
      return
    }
    setQueryParams({
      ...queryParams,
      releasedAtEnd: todayEnd.toISOString()
    })
  }, [queryParams, rangeEnd, setQueryParams, todayEnd])
  const shiftRange = direction => {
    const shifted = getShiftedRange(direction)
    if (!shifted) {
      return
    }
    setQueryParams({
      ...queryParams,
      releasedAtStart: shifted.start.toISOString(),
      releasedAtEnd: shifted.end.toISOString()
    })
  }

  if (done) {
    return result
  }

  return (
    <div className="scrollable-y">
      <div className="p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              disabled={!canGoPrevious}
              onClick={() => shiftRange(-1)}
            >
              <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} /> previous year
            </Button>
            <div className="fw-semibold">{displayedRangeLabel}</div>
            <Button
              variant="outline-secondary"
              disabled={!canGoNext}
              onClick={() => shiftRange(1)}
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
          <div className="fw-semibold">Total reports: {totalReports}</div>
          <div className="text-muted">
            Counts reflect the current search filters.
          </div>
        </div>

        {!hasRange ? (
          <em>
            Select a Release Date range in search filters to view results.
          </em>
        ) : !hasData ? (
          <em>No reports found for the selected range.</em>
        ) : (
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
                xPadding={barPadding}
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
                    <th className="text-end">Reports</th>
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
        )}
      </div>
    </div>
  )
}

const buildMonthlyPeriods = (rangeStart, rangeEnd) => {
  const startOfFirstMonth = moment(rangeStart).startOf("month")
  const startOfLastMonth = moment(rangeEnd).startOf("month")
  const totalMonths = startOfLastMonth.diff(startOfFirstMonth, "months") + 1
  return Array.from({ length: totalMonths }, (_, index) => {
    const start = moment(startOfFirstMonth).add(index, "month").startOf("month")
    const monthEnd = moment(start).endOf("month")
    const isFirst = index === 0
    const isLast = index === totalMonths - 1
    const periodStart = isFirst ? moment(rangeStart) : start
    const periodEnd = isLast ? moment(rangeEnd) : monthEnd
    return {
      periodKey: start.format("YYYY-MM"),
      label: start.format("MMM"),
      periodRange: `${periodStart.format("MMM D")} - ${periodEnd.format(
        "MMM D"
      )}`
    }
  })
}

const buildWeeklyPeriods = (rangeStart, rangeEnd) => {
  const startOfRange = moment(rangeStart).startOf(WEEK_PERIOD_KEY)
  const endOfRange = moment(rangeEnd).startOf(WEEK_PERIOD_KEY)
  const totalWeeks = endOfRange.diff(startOfRange, "weeks") + 1
  return Array.from({ length: totalWeeks }, (_, index) => {
    const start = moment(startOfRange).add(index, "weeks")
    const isFirst = index === 0
    const isLast = index === totalWeeks - 1
    const periodStart = isFirst ? moment(rangeStart) : moment(start)
    let periodEnd = moment(start).endOf(WEEK_PERIOD_KEY)
    if (isLast || periodEnd.isAfter(rangeEnd)) {
      periodEnd = moment(rangeEnd)
    }
    const weekLabel = getWeekKey(periodStart)
    return {
      periodKey: weekLabel,
      label: weekLabel,
      periodRange: `${periodStart.format("MMM D")} - ${periodEnd.format(
        "MMM D"
      )}`
    }
  })
}

const getWeekKey = date => date.format(WEEK_PERIOD_FORMAT)

export default PublishedReportsOverTime
