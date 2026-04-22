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
import React, { useMemo, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { useResizeDetector } from "react-resize-detector"
import Settings from "settings"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        state
        releasedAt
        engagementDate
      }
    }
  }
`

const BAR_HEIGHT = 320
const GRANULARITY = {
  MONTH: "month",
  WEEK: "week"
}

enum ReportDate {
  ENGAGEMENT = "Engagement Date",
  PUBLICATION = "Publication Date"
}

function getRangeStart(
  rangeStart: moment.Moment,
  usePublicationDate: boolean
): moment.Moment {
  const newRangeStart = rangeStart.startOf("year")
  const startOfYear = moment().startOf("year")
  if (usePublicationDate && newRangeStart.isAfter(startOfYear)) {
    return startOfYear
  }
  return newRangeStart
}

function getRangeEnd(
  rangeStart: moment.Moment,
  usePublicationDate: boolean
): moment.Moment {
  const rangeEnd = moment(rangeStart).add(1, "year").add(-1, "day").endOf("day")
  const endOfDay = moment().endOf("day")
  if (usePublicationDate && rangeEnd.isAfter(endOfDay)) {
    return endOfDay
  }
  return rangeEnd
}

function getDateField(
  obj,
  usePublicationDate: boolean,
  mark: string = ""
): moment.Moment {
  const selectedDate =
    obj?.[`${usePublicationDate ? "releasedAt" : "engagementDate"}${mark}`]
  if (selectedDate) {
    return moment(selectedDate)
  } else {
    return null
  }
}

function getStartDate(queryParams, usePublicationDate: boolean): moment.Moment {
  return getDateField(queryParams, usePublicationDate, "Start")
}

function getEndDate(queryParams, usePublicationDate: boolean) {
  return getDateField(queryParams, usePublicationDate, "End")
}

interface PublishedReportsOverTimeProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setQueryParams?: (...args: unknown[]) => unknown
}

const ReportsAggregatedOverTime = ({
  pageDispatchers,
  queryParams,
  setQueryParams
}: PublishedReportsOverTimeProps) => {
  const [granularity, setGranularity] = useState(GRANULARITY.MONTH)
  const [usePublicationDate, setUsePublicationDate] = useState(true)
  usePageTitle("Aggregated Reports Over Time")

  const { width, ref } = useResizeDetector()
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
    if (!data) {
      return []
    }
    const reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    const startDate = getStartDate(queryParams, usePublicationDate)
    const endDate = getEndDate(queryParams, usePublicationDate)
    const periods =
      granularity === GRANULARITY.MONTH
        ? buildMonthlyPeriods(startDate, endDate)
        : buildWeeklyPeriods(startDate, endDate)
    const counts = reportsList.reduce((acc, report) => {
      const dateField = getDateField(report, usePublicationDate)
      if (!dateField) {
        return acc
      }
      const dateValue = moment(dateField)
      const key =
        granularity === GRANULARITY.MONTH
          ? getMonthKey(dateValue)
          : getWeekKey(dateValue)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return periods.map(period => ({
      ...period,
      reportsCount: counts[period.periodKey] || 0
    }))
  }, [data, queryParams, usePublicationDate, granularity])
  const startDate = getStartDate(queryParams, usePublicationDate)
  const endDate = getEndDate(queryParams, usePublicationDate)

  const getNoDateRangeMessage = () => {
    return `Select a ${usePublicationDate ? "Release" : "Engagement"} Date range in search filters to view results.`
  }

  const displayedRangeLabel = (() => {
    if (!startDate || !endDate) {
      return getNoDateRangeMessage()
    }
    const start = getStartDate(queryParams, usePublicationDate)
    const end = getEndDate(queryParams, usePublicationDate)
    return `${start.format(Settings.dateFormats.forms.displayShort.date)} — ${end.format(Settings.dateFormats.forms.displayShort.date)}`
  })()

  const totalReports = graphData.reduce(
    (total, period) => total + period.reportsCount,
    0
  )
  const chartWidth = width || 0
  const barPadding = 0.1
  const hasData = graphData.length > 0

  const rangeStart = getStartDate(queryParams, usePublicationDate)
  const rangeEnd = getEndDate(queryParams, usePublicationDate)
  const hasRange = rangeStart && rangeEnd

  const canGoNext =
    hasRange &&
    (!usePublicationDate || rangeEnd.isBefore(moment().endOf("day")))
  const canGoPrevious = hasRange

  const updateQueryParams = (
    newUsePublicationDate: boolean,
    direction: number = 0
  ) => {
    const newRangeStart = getRangeStart(
      getStartDate(queryParams, usePublicationDate).add(direction, "year"),
      newUsePublicationDate
    )
    const newRangeEnd = getRangeEnd(newRangeStart, newUsePublicationDate)
    if (newUsePublicationDate) {
      setQueryParams({
        ...Object.without(
          queryParams,
          "engagementDateStart",
          "engagementDateEnd"
        ),
        releasedAtStart: newRangeStart.toISOString(),
        releasedAtEnd: newRangeEnd.toISOString()
      })
    } else {
      setQueryParams({
        ...Object.without(queryParams, "releasedAtStart", "releasedAtEnd"),
        engagementDateStart: newRangeStart.toISOString(),
        engagementDateEnd: newRangeEnd.toISOString()
      })
    }
    setUsePublicationDate(newUsePublicationDate)
  }

  const shiftRange = (direction: number) => {
    updateQueryParams(usePublicationDate, direction)
  }

  const updateUsePublicationDate = (newUsePublicationDate: boolean) => {
    updateQueryParams(newUsePublicationDate)
  }

  if (done) {
    return result
  }

  return (
    <div className="scrollable-y">
      <div className="p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-semibold">Date to use in the report</div>
            <select
              id="report-date-type"
              style={{ width: "unset" }}
              disabled={!hasRange}
              value={
                usePublicationDate
                  ? ReportDate.PUBLICATION
                  : ReportDate.ENGAGEMENT
              }
              onChange={e =>
                updateUsePublicationDate(
                  e.target.value === ReportDate.PUBLICATION
                )
              }
              className="form-select"
            >
              <option value={ReportDate.PUBLICATION}>Publication Date</option>
              <option value={ReportDate.ENGAGEMENT}>Engagement Date</option>
            </select>
            <Button
              variant="outline-secondary"
              disabled={!canGoPrevious}
              onClick={() => shiftRange(-1)}
            >
              <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} /> previous year
            </Button>
            <div className="fw-semibold" data-testid="range-label">
              {displayedRangeLabel}
            </div>
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
          <em>{getNoDateRangeMessage()}</em>
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

const buildMonthlyPeriods = (
  rangeStart: moment.Moment,
  rangeEnd: moment.Moment
) => {
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
    const monthLabel = getMonthKey(periodStart)
    return {
      periodKey: monthLabel,
      label: monthLabel,
      periodRange: `${periodStart.format("MMM D")} - ${periodEnd.format(
        "MMM D"
      )}`
    }
  })
}

const buildWeeklyPeriods = (
  rangeStart: moment.Moment,
  rangeEnd: moment.Moment
) => {
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

const getMonthKey = (date: moment.Moment) => date.format("MMM YYYY")
const getWeekKey = (date: moment.Moment) => date.format(WEEK_PERIOD_FORMAT)

export default ReportsAggregatedOverTime
