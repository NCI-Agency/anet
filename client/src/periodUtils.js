import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

const now = moment()

export const RECURRENCE_TYPE = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  SEMIMONTHLY: "semimonthly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  SEMIANNUALY: "semiannualy"
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
  // FIXME: biweekly should be each 2 weeks from the beginning of the year
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
  [RECURRENCE_TYPE.SEMIMONTHLY]: (date, offset) => ({
    start:
      date.date() < 15
        ? date.clone().subtract(offset, "months").startOf("month")
        : date.clone().subtract(offset, "months").startOf("month").date(15),
    end:
      date.date() < 15
        ? date.clone().subtract(offset, "months").startOf("month").date(14)
        : date.clone().subtract(offset, "months").endOf("month")
  }),
  [RECURRENCE_TYPE.MONTHLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "months").startOf("month"),
    end: date.clone().subtract(offset, "months").endOf("month")
  }),
  [RECURRENCE_TYPE.QUARTERLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "quarters").startOf("quarter"),
    end: date.clone().subtract(offset, "quarters").endOf("quarter")
  }),
  [RECURRENCE_TYPE.SEMIANNUALY]: (date, offset) => ({
    start: date
      .clone()
      .subtract(2 * offset, "quarters")
      .startOf("quarter"),
    end: date
      .clone()
      .subtract(2 * offset, "quarters")
      .endOf("quarter")
  })
}

export const getPeriodsConfig = (
  recurrence,
  numberOfperiods,
  offset,
  forAssessments = false
) => {
  const periods = []
  for (var i = numberOfperiods - 1; i >= 0; i--) {
    const periodDetails = { ...PERIOD_FACTORIES[recurrence](now, offset + i) }
    if (forAssessments) {
      periodDetails.allowNewAssessments = offset + i !== 0
    }
    periods.push(periodDetails)
  }
  return {
    recurrence: recurrence,
    periods: periods
  }
}

export const PeriodPropType = PropTypes.shape({
  start: PropTypes.object,
  end: PropTypes.object
})
export const AssessmentPeriodPropType = PropTypes.shape({
  start: PropTypes.object,
  end: PropTypes.object,
  allowNewAssessments: PropTypes.bool
})

export const PeriodsPropType = PropTypes.arrayOf(PeriodPropType)
export const PeriodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  periods: PeriodsPropType
})
export const PeriodsDetailsPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  numberOfPeriods: PropTypes.number
})
export const AssessmentPeriodsPropType = PropTypes.arrayOf(
  AssessmentPeriodPropType
)
export const AssessmentPeriodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  periods: AssessmentPeriodsPropType
})

const PERIOD_START_SHORT_FORMAT = "D"
const PERIOD_START_MIDDLE_FORMAT = "D MMMM"
const PERIOD_START_LONG_FORMAT = "D MMMM YYYY"
const PERIOD_END_FORMAT = "D MMMM YYYY"

export const periodToString = period => {
  if (period.start.isSame(period.end, "day")) {
    return period.end.format(PERIOD_END_FORMAT)
  } else {
    const periodStartFormat =
      period.start.year() !== period.end.year()
        ? PERIOD_START_LONG_FORMAT
        : period.start.month() !== period.end.month()
          ? PERIOD_START_MIDDLE_FORMAT
          : PERIOD_START_SHORT_FORMAT
    return `${period.start.format(periodStartFormat)} - ${period.end.format(
      PERIOD_END_FORMAT
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
