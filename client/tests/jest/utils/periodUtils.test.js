import moment from "moment"
import { PERIOD_FACTORIES, RECURRENCE_TYPE } from "../../../src/periodUtils"

const FORMAT = "YYYY-MM-DD"
// 7 examples
const EXAMPLE_INPUT_DATES_AND_OFFSETS = [
  {
    // 0
    date: "2020-01-01",
    offset: 1,
    expectedPeriods: {
      semiMonthly: {
        start: "2019-12-15",
        end: "2019-12-31"
      },
      semiAnnually: {
        start: "2019-07-01",
        end: "2019-12-31"
      },
      biweekly: {
        start: "2019-12-09",
        end: "2019-12-22"
      }
    }
  },
  {
    // 1
    date: "2020-01-31",
    offset: 3,
    expectedPeriods: {
      semiMonthly: {
        start: "2019-12-01",
        end: "2019-12-14"
      },
      semiAnnually: {
        start: "2018-07-01",
        end: "2018-12-31"
      },
      biweekly: {
        start: "2019-12-09",
        end: "2019-12-22"
      }
    }
  },
  {
    // 2
    date: "2020-02-29",
    offset: 1,
    expectedPeriods: {
      semiMonthly: {
        start: "2020-02-01",
        end: "2020-02-14"
      },
      semiAnnually: {
        start: "2019-07-01",
        end: "2019-12-31"
      },
      biweekly: {
        start: "2020-02-03",
        end: "2020-02-16"
      }
    }
  },
  {
    // 3
    date: "2020-03-01",
    offset: -1,
    expectedPeriods: {
      semiMonthly: {
        start: "2020-03-15",
        end: "2020-03-31"
      },
      semiAnnually: {
        start: "2020-07-01",
        end: "2020-12-31"
      },
      biweekly: {
        start: "2020-03-02",
        end: "2020-03-15"
      }
    }
  },
  {
    // 4
    date: "2020-12-31",
    offset: -1,
    expectedPeriods: {
      semiMonthly: {
        start: "2021-01-01",
        end: "2021-01-14"
      },
      semiAnnually: {
        start: "2021-01-01",
        end: "2021-06-30"
      },
      biweekly: {
        start: "2021-01-04",
        end: "2021-01-17"
      }
    }
  },
  {
    // 5
    date: "2020-07-01",
    offset: 2,
    expectedPeriods: {
      semiMonthly: {
        start: "2020-06-01",
        end: "2020-06-14"
      },
      semiAnnually: {
        start: "2019-07-01",
        end: "2019-12-31"
      },
      biweekly: {
        start: "2020-05-25",
        end: "2020-06-07"
      }
    }
  },
  {
    // 6
    date: "2020-07-01",
    offset: -2,
    expectedPeriods: {
      semiMonthly: {
        start: "2020-08-01",
        end: "2020-08-14"
      },
      semiAnnually: {
        start: "2021-07-01",
        end: "2021-12-31"
      },
      biweekly: {
        start: "2020-07-20",
        end: "2020-08-02"
      }
    }
  }
]

// test with index so that if it fails we know which date from the array
describe("For period creation utility", () => {
  it("We should get the correct biweekly periods given example input", () => {
    EXAMPLE_INPUT_DATES_AND_OFFSETS.forEach((input, index) => {
      const period = PERIOD_FACTORIES[RECURRENCE_TYPE.BIWEEKLY](
        moment(input.date),
        input.offset
      )
      expect(prefix(index) + period.start.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.biweekly.start
      )
      expect(prefix(index) + period.end.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.biweekly.end
      )
    })
  })
  it("We should get the correct semimonthly periods given example input", () => {
    EXAMPLE_INPUT_DATES_AND_OFFSETS.forEach((input, index) => {
      const period = PERIOD_FACTORIES[RECURRENCE_TYPE.SEMIMONTHLY](
        moment(input.date),
        input.offset
      )
      expect(prefix(index) + period.start.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiMonthly.start
      )
      expect(prefix(index) + period.end.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiMonthly.end
      )
    })
  })
  it("We should get the correct semiannually periods given example input", () => {
    EXAMPLE_INPUT_DATES_AND_OFFSETS.forEach((input, index) => {
      const period = PERIOD_FACTORIES[RECURRENCE_TYPE.SEMIANNUALLY](
        moment(input.date),
        input.offset
      )
      expect(prefix(index) + period.start.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiAnnually.start
      )
      expect(prefix(index) + period.end.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiAnnually.end
      )
    })
  })
})

const prefix = index => index + "-) "
