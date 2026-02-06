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

const BAR_WIDTH_MONTHLY = 44
const BAR_WIDTH_WEEKLY = 28
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
  if (moment.isMoment(value)) {
    return value.clone()
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
      ...(queryParams || {}),
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
          : getWeekKey(releasedAt, rangeStart)
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
  const minBarWidth =
    granularity === GRANULARITY.MONTH ? BAR_WIDTH_MONTHLY : BAR_WIDTH_WEEKLY
  const chartWidth = Math.max(width || 0, graphData.length * minBarWidth)
  const hasData = graphData.length > 0
  const isCurrentYearClampedRange =
    hasRange &&
    rangeStart.isSame(rangeStart.clone().startOf("year"), "day") &&
    displayRangeEnd.isSame(todayEnd, "day") &&
    rangeStart.isSame(todayEnd, "year")
  const isFullYearRange =
    hasRange &&
    rangeStart.isSame(rangeStart.clone().startOf("year"), "day") &&
    displayRangeEnd.isSame(displayRangeEnd.clone().endOf("year"), "day")
  const getShiftedRange = direction => {
    if (!hasRange) {
      return null
    }
    let nextStart = rangeStart.clone().add(direction, "year")
    let nextEnd = displayRangeEnd.clone().add(direction, "year")
    if (direction < 0 && isCurrentYearClampedRange) {
      nextStart = nextStart.startOf("year")
      nextEnd = nextStart.clone().endOf("year")
    } else if (direction > 0 && isFullYearRange) {
      nextStart = nextStart.startOf("year")
      if (nextStart.isSame(todayEnd, "year")) {
        nextEnd = todayEnd.clone()
      } else {
        nextEnd = nextStart.clone().endOf("year")
      }
    } else if (direction > 0 && nextEnd.isAfter(todayEnd)) {
      nextEnd = todayEnd.clone()
    }
    if (direction > 0 && nextStart.isAfter(todayEnd, "day")) {
      return null
    }
    return { start: nextStart, end: nextEnd }
  }

  const canGoNewer = Boolean(getShiftedRange(1))
  const canGoPrevious = Boolean(getShiftedRange(-1))
  const updateQueryParams = nextQueryParams => setQueryParams?.(nextQueryParams)
  useEffect(() => {
    if (!rangeEnd || !rangeEnd.isAfter(todayEnd)) {
      return
    }
    updateQueryParams({
      ...(queryParams || {}),
      releasedAtEnd: todayEnd.toISOString()
    })
  }, [queryParams, rangeEnd, todayEnd])
  const shiftRange = direction => {
    const shifted = getShiftedRange(direction)
    if (!shifted) {
      return
    }
    updateQueryParams({
      ...(queryParams || {}),
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
              disabled={!canGoNewer}
              onClick={() => shiftRange(1)}
            >
              newer year <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
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
        ) : hasData ? (
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
        ) : (
          <em>No reports found for the selected range.</em>
        )}
      </div>
    </div>
  )
}

const buildMonthlyPeriods = (rangeStart, rangeEnd) => {
  const startOfFirstMonth = rangeStart.clone().startOf("month")
  const startOfLastMonth = rangeEnd.clone().startOf("month")
  const totalMonths = startOfLastMonth.diff(startOfFirstMonth, "months") + 1
  return Array.from({ length: totalMonths }, (_, index) => {
    const start = startOfFirstMonth.clone().add(index, "month").startOf("month")
    const monthEnd = start.clone().endOf("month")
    const isFirst = index === 0
    const isLast = index === totalMonths - 1
    const periodStart = isFirst ? rangeStart.clone() : start
    const periodEnd = isLast ? rangeEnd.clone() : monthEnd
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
  const startOfRange = rangeStart.clone().startOf("day")
  const endOfRange = rangeEnd.clone().startOf("day")
  const totalWeeks = endOfRange.diff(startOfRange, "weeks") + 1
  return Array.from({ length: totalWeeks }, (_, index) => {
    const start = startOfRange.clone().add(index, "weeks")
    const isFirst = index === 0
    const isLast = index === totalWeeks - 1
    const periodStart = isFirst ? rangeStart.clone() : start.clone()
    let periodEnd = start.clone().add(6, "days").endOf("day")
    if (isLast || periodEnd.isAfter(rangeEnd)) {
      periodEnd = rangeEnd.clone()
    }
    const weekLabel = String(index + 1).padStart(2, "0")
    return {
      periodKey: `W${weekLabel}`,
      label: `W${weekLabel}`,
      periodRange: `${periodStart.format("MMM D")} - ${periodEnd.format(
        "MMM D"
      )}`
    }
  })
}

const getWeekKey = (releasedAt, rangeStart) => {
  const weekIndex = releasedAt
    .clone()
    .startOf("day")
    .diff(rangeStart.clone().startOf("day"), "weeks")
  const weekLabel = String(weekIndex + 1).padStart(2, "0")
  return `W${weekLabel}`
}

export default PublishedReportsOverTime
