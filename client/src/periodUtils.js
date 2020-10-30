import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { momentObj } from "react-moment-proptypes"

const ASSESSMENT_PERIOD_DATE_FORMAT = "YYYY-MM-DD"

export function formatPeriodBoundary(periodBoundary) {
  return periodBoundary.format(ASSESSMENT_PERIOD_DATE_FORMAT)
}

export function dateBelongsToPeriod(date, period) {
  const momentDate = moment(date)
  // true when date is same as period start date or inside the period
  return (
    formatPeriodBoundary(momentDate) === formatPeriodBoundary(period.start) ||
    (momentDate.isAfter(period.start) && momentDate.isBefore(period.end))
  )
}

export const RECURRENCE_TYPE = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  SEMIMONTHLY: "semimonthly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  SEMIANNUALY: "semiannualy",
  ANNUALLY: "annually"
}

const PERIOD_FORMAT = {
  START_SHORT: "D",
  START_MIDDLE: "D MMMM",
  START_LONG: "D MMMM YYYY",
  END_LONG: "D MMMM YYYY"
}

export const PERIOD_FACTORIES = {
  [RECURRENCE_TYPE.DAILY]: (date, offset) => ({
    start: date.clone().subtract(offset, "days").startOf("day"),
    end: date.clone().subtract(offset, "days").endOf("day")
  }),
  [RECURRENCE_TYPE.WEEKLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "weeks").startOf("week"),
    end: date.clone().subtract(offset, "weeks").endOf("week")
  }),
  // FIXME: biweekly calculation should be changed, first agree on what it means
  [RECURRENCE_TYPE.BIWEEKLY]: (date, offset) => ({
    start: date
      .clone()
      .subtract(2 * offset, "weeks")
      .startOf("week"),
    end: date
      .clone()
      .subtract(2 * offset, "weeks")
      .endOf("week")
  }),
  [RECURRENCE_TYPE.SEMIMONTHLY]: (date, offset) => {
    const isDateFirstHalf = date.date() < 15
    let isPeriodInFirstHalf
    let periodMonthStart

    if (offset % 2 === 0) {
      periodMonthStart = date
        .clone()
        .subtract(offset / 2, "months")
        .startOf("month")
      isPeriodInFirstHalf = isDateFirstHalf
    } else {
      // if odd, things are more complicated
      // We can't just subtract 15 days due to corner cases like 28 day Feb, 31 day months etc
      const diffInMonths = isDateFirstHalf
        ? Math.ceil(offset / 2)
        : Math.floor(offset / 2)

      periodMonthStart = date
        .clone()
        .subtract(diffInMonths, "months")
        .startOf("month")

      // since offset is odd, opposite of the date
      isPeriodInFirstHalf = !isDateFirstHalf
    }
    return isPeriodInFirstHalf
      ? {
        start: periodMonthStart,
        end: periodMonthStart.clone().endOf("day").add(13, "days") // end of day 14
      }
      : {
        start: periodMonthStart.clone().add(14, "days"), // start of day 15
        end: periodMonthStart.clone().endOf("month")
      }
  },
  [RECURRENCE_TYPE.MONTHLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "months").startOf("month"),
    end: date.clone().subtract(offset, "months").endOf("month")
  }),
  [RECURRENCE_TYPE.QUARTERLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "quarters").startOf("quarter"),
    end: date.clone().subtract(offset, "quarters").endOf("quarter")
  }),
  [RECURRENCE_TYPE.SEMIANNUALY]: (date, offset) => {
    const baseDate = date.clone().subtract(2 * offset, "quarters")
    const isFirstHalfOfTheYear = baseDate.month() < 7
    const baseYearStart = baseDate.clone().startOf("year")

    return {
      start: isFirstHalfOfTheYear
        ? baseYearStart // 1 Jan
        : baseYearStart.clone().add(6, "months"), // 1 July
      end: isFirstHalfOfTheYear
        ? baseYearStart.clone().endOf("month").add(5, "months") // 30 June
        : baseYearStart.clone().endOf("year") // 31 December
    }
  },
  [RECURRENCE_TYPE.ANNUALLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "years").startOf("year"),
    end: date.clone().subtract(offset, "years").endOf("year")
  })
}

export const getPeriodsConfig = (
  recurrence,
  numberOfperiods,
  offset,
  forAssessments = false
) => {
  const now = moment()
  const periods = []
  for (let i = numberOfperiods - 1; i >= 0; i--) {
    const periodDetails = PERIOD_FACTORIES[recurrence](now, offset + i)
    if (forAssessments) {
      // don't allow assessments for current and future periods
      periodDetails.allowNewAssessments = offset + i > 0
    }
    periods.push(periodDetails)
  }
  return {
    recurrence: recurrence,
    periods: periods
  }
}

export const PeriodsDetailsPropType = PropTypes.shape({
  recurrence: PropTypes.string.isRequired,
  numberOfPeriods: PropTypes.number.isRequired
})

export const PeriodPropType = PropTypes.shape({
  start: momentObj.isRequired,
  end: momentObj.isRequired
})
export const PeriodsPropType = PropTypes.arrayOf(PeriodPropType)
export const PeriodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string.isRequired,
  periods: PeriodsPropType.isRequired
})

export const AssessmentPeriodPropType = PropTypes.shape({
  start: momentObj.isRequired,
  end: momentObj.isRequired,
  allowNewAssessments: PropTypes.bool
})
export const AssessmentPeriodsPropType = PropTypes.arrayOf(
  AssessmentPeriodPropType
)
export const AssessmentPeriodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string.isRequired,
  periods: AssessmentPeriodsPropType.isRequired
})

export const periodToString = period => {
  if (period.start.isSame(period.end, "day")) {
    return period.end.format(PERIOD_FORMAT.END_LONG)
  } else {
    const periodStartFormat =
      period.start.year() !== period.end.year()
        ? PERIOD_FORMAT.START_LONG
        : period.start.month() !== period.end.month()
          ? PERIOD_FORMAT.START_MIDDLE
          : PERIOD_FORMAT.START_SHORT
    return `${period.start.format(periodStartFormat)} - ${period.end.format(
      PERIOD_FORMAT.END_LONG
    )}`
  }
}

export const PeriodsTableHeader = ({ periodsConfig }) => (
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
PeriodsTableHeader.propTypes = {
  periodsConfig: PropTypes.oneOfType([
    AssessmentPeriodsConfigPropType,
    PeriodsConfigPropType
  ])
}
