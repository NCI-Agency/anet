import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { momentObj } from "react-moment-proptypes"

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
  }),
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
