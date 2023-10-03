import moment from "moment"
import PropTypes from "prop-types"
import React, { useLayoutEffect } from "react"
import { momentObj } from "react-moment-proptypes"
import useDimensions from "react-use-dimensions"

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
  SEMIANNUALLY: "semiannually",
  ANNUALLY: "annually",
  ON_DEMAND: "ondemand"
}

const PERIOD_FORMAT = {
  START_SHORT: "D",
  START_MIDDLE: "D MMMM",
  START_LONG: "D MMMM YYYY",
  END_LONG: "D MMMM YYYY"
}

const weekType = "isoWeek"

const refMondayForBiweekly = "2021-01-04" // lets select 1st monday of 2021

export const PERIOD_FACTORIES = {
  [RECURRENCE_TYPE.DAILY]: (date, offset) => ({
    start: date.clone().subtract(offset, "days").startOf("day"),
    end: date.clone().subtract(offset, "days").endOf("day")
  }),
  [RECURRENCE_TYPE.WEEKLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "weeks").startOf("week"),
    end: date.clone().subtract(offset, "weeks").endOf("week")
  }),
  [RECURRENCE_TYPE.BIWEEKLY]: (date, offset) => {
    // every biweekly period's start is even number of weeks apart from reference monday
    const refMonday = moment(refMondayForBiweekly).startOf(weekType)
    const curWeekMonday = date.clone().startOf(weekType)

    const diffInWeeks = refMonday.diff(curWeekMonday, "weeks")
    // current biweekly period's start has to be even number of weeks apart from reference monday
    const curBiweeklyStart =
      diffInWeeks % 2 === 0
        ? curWeekMonday
        : curWeekMonday.clone().subtract(1, "weeks")

    const curBiweeklyEnd = curBiweeklyStart
      .clone()
      .add(1, "weeks")
      .endOf(weekType)

    return {
      start: curBiweeklyStart.clone().subtract(2 * offset, "weeks"),
      end: curBiweeklyEnd.clone().subtract(2 * offset, "weeks")
    }
  },
  // for more context read: https://github.com/NCI-Agency/anet/pull/3272#discussion_r515826676
  [RECURRENCE_TYPE.SEMIMONTHLY]: (date, offset) => {
    // With first half we mean first half of a month
    const startDateOfSecondHalf = 15
    const isDateInFirstHalf = date.date() < startDateOfSecondHalf
    let isTargetPeriodFirstHalf
    let monthsToTarget

    if (offset % 2 === 0) {
      monthsToTarget = offset / 2
      // even number offset means same half with given date
      isTargetPeriodFirstHalf = isDateInFirstHalf
    } else {
      monthsToTarget = isDateInFirstHalf
        ? Math.ceil(offset / 2)
        : Math.floor(offset / 2)
      // since offset is odd, opposite of the given date
      isTargetPeriodFirstHalf = !isDateInFirstHalf
    }
    const targetPeriodMonth = date.clone().subtract(monthsToTarget, "months")

    return isTargetPeriodFirstHalf
      ? {
        start: targetPeriodMonth.clone().startOf("month"),
        end: targetPeriodMonth
          .clone()
          .date(startDateOfSecondHalf - 1)
          .endOf("day")
      }
      : {
        start: targetPeriodMonth
          .clone()
          .date(startDateOfSecondHalf)
          .startOf("day"),
        end: targetPeriodMonth.clone().endOf("month")
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
  [RECURRENCE_TYPE.SEMIANNUALLY]: (date, offset) => {
    const monthsInHalfYear = 6
    // months start from 0
    const isDateInFirstHalfOfTheYear = date.month() < monthsInHalfYear
    const aDateInTargetPeriod = date
      .clone()
      .subtract(monthsInHalfYear * offset, "months")
    const isTargetPeriodFirstHalfOfTheYear =
      offset % 2 === 0
        ? isDateInFirstHalfOfTheYear
        : !isDateInFirstHalfOfTheYear

    return isTargetPeriodFirstHalfOfTheYear
      ? {
        start: aDateInTargetPeriod.clone().startOf("year"), // 1 Jan
        end: aDateInTargetPeriod
          .clone()
          .month(monthsInHalfYear - 1)
          .endOf("month") // 30 June
      }
      : {
        start: aDateInTargetPeriod
          .clone()
          .month(monthsInHalfYear)
          .startOf("month"), // 1 July
        end: aDateInTargetPeriod.clone().endOf("year") // 31 December
      }
  },
  [RECURRENCE_TYPE.ANNUALLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "years").startOf("year"),
    end: date.clone().subtract(offset, "years").endOf("year")
  })
}

export const getPeriodsConfig = (
  recurrence,
  numberOfPeriods,
  offset,
  forAssessments = false
) => {
  const now = moment()
  const periods = []
  for (let i = numberOfPeriods - 1; i >= 0; i--) {
    const periodDetails = PERIOD_FACTORIES[recurrence](now, offset + i)

    if (forAssessments) {
      // allow new assessments
      periodDetails.allowNewAssessments = true
    }

    periods.push(periodDetails)
  }
  return {
    recurrence,
    periods
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

export function getOverlappingPeriodIndexes(inputPeriods) {
  const overlappingDateIndexes = []
  const periods = inputPeriods || []

  for (let i = 0; i < periods.length; i++) {
    // end time being null means it is still continuing, might as well pick a large number for it
    const endTime1 = periods[i].endTime || Infinity
    // Search against other periods
    for (let j = i + 1; j < periods.length; j++) {
      const endTime2 = periods[j].endTime || Infinity
      if (periods[i].startTime < endTime2 && endTime1 > periods[j].startTime) {
        overlappingDateIndexes.push([i, j])
      }
    }
  }

  return overlappingDateIndexes
}

const SCREEN_SIZES = {
  largeLowLimit: 1000,
  midLowLimit: 600
  // further lower is small, no need for a limit
}

const SCREEN_SIZE_TO_PERIOD_NUMBER = {
  large: {
    isMatch: width => width >= SCREEN_SIZES.largeLowLimit,
    num: 3
  },
  mid: {
    isMatch: width =>
      width > SCREEN_SIZES.midLowLimit && width < SCREEN_SIZES.largeLowLimit,
    num: 2
  },
  small: {
    isMatch: width => width <= SCREEN_SIZES.midLowLimit,
    num: 1
  }
}

function getPeriodNumberForScreen(width) {
  for (const { isMatch, num } of Object.values(SCREEN_SIZE_TO_PERIOD_NUMBER)) {
    if (isMatch(width)) {
      return num
    }
  }
  throw new Error(
    "Invalid width or screen sizes are not continuous. width= ",
    width
  )
}

export const useResponsiveNumberOfPeriods = setNumberOfPeriods => {
  const [contRef, dimensions] = useDimensions()
  useLayoutEffect(() => {
    if (dimensions?.width) {
      const containerWidth = dimensions.width
      setNumberOfPeriods(getPeriodNumberForScreen(containerWidth))
    }
  }, [setNumberOfPeriods, dimensions])
  return contRef
}
