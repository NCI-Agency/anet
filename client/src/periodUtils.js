import PropTypes from "prop-types"
import React from "react"

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
