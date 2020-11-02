import moment from "moment"
import { PERIOD_FACTORIES, RECURRENCE_TYPE } from "../../src/periodUtils"

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
      semiAnnualy: {
        start: "2019-07-01",
        end: "2019-12-31"
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
      semiAnnualy: {
        start: "2018-07-01",
        end: "2018-12-31"
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
      semiAnnualy: {
        start: "2019-07-01",
        end: "2019-12-31"
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
      semiAnnualy: {
        start: "2020-07-01",
        end: "2020-12-31"
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
      semiAnnualy: {
        start: "2021-01-01",
        end: "2021-06-30"
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
      semiAnnualy: {
        start: "2019-07-01",
        end: "2019-12-31"
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
      semiAnnualy: {
        start: "2021-07-01",
        end: "2021-12-31"
      }
    }
  }
]

// test with index so that if it fails we know which date from the array
describe("For period creation utility", () => {
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
  it("We should get the correct semiannualy periods given example input", () => {
    EXAMPLE_INPUT_DATES_AND_OFFSETS.forEach((input, index) => {
      const period = PERIOD_FACTORIES[RECURRENCE_TYPE.SEMIANNUALY](
        moment(input.date),
        input.offset
      )
      expect(prefix(index) + period.start.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiAnnualy.start
      )
      expect(prefix(index) + period.end.format(FORMAT)).toEqual(
        prefix(index) + input.expectedPeriods.semiAnnualy.end
      )
    })
  })
})

const prefix = index => index + "-) "
