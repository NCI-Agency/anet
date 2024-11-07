import moment from "moment"
import Settings from "settings"
import { v4 as uuidv4 } from "uuid"
import Report from "../../../src/models/Report"

function tStart(report) {
  return moment(report.engagementDate).toDate().getTime()
}

function tEnd(report) {
  return moment(report.engagementDate)
    .add(report.duration, "minutes")
    .toDate()
    .getTime()
}

describe("report model", () => {
  it("should return empty string for blank report or blank engagementDate", () => {
    expect(Report.getFormattedEngagementDate()).toEqual("")
    expect(Report.getFormattedEngagementDate({})).toEqual("")
    expect(Report.getFormattedEngagementDate({ engagementDate: null })).toEqual(
      ""
    )
  })

  it("should format engagement date without time when engagements do not include time and duration", () => {
    Settings.engagementsIncludeTimeAndDuration = false
    const d0 = new Date(1985, 5, 12, 23, 0, 0, 0)
    const fd = Report.getFormattedEngagementDate({ engagementDate: d0 })
    expect(fd).toEqual(moment(d0).format(Report.getEngagementDateFormat()))
  })

  it("should format engagement date as all day when duration is blank", () => {
    Settings.engagementsIncludeTimeAndDuration = true
    const d0 = new Date(1985, 5, 12, 23, 0, 0, 0)

    expect(Report.getFormattedEngagementDate({ engagementDate: d0 })).toEqual(
      moment(d0).format(Settings.dateFormats.forms.displayLong.date) +
        " (all day)"
    )
  })

  it("should show date and time range in formatted engagement date when report starts and ends within same day", () => {
    Settings.engagementsIncludeTimeAndDuration = true
    const d0 = new Date(1985, 5, 12, 23, 0, 0, 0)
    const d1 = new Date(1985, 5, 12, 23, 30, 0, 0)

    const fd = Report.getFormattedEngagementDate({
      engagementDate: d0,
      duration: 30
    })
    expect(fd).toEqual(
      moment(d0).format(Report.getEngagementDateFormat()) +
        moment(d1).format(" - HH:mm")
    )
  })

  it("should display date and time for both start and end when report doesn't start and end within same day", () => {
    Settings.engagementsIncludeTimeAndDuration = true
    const d0 = new Date(1985, 5, 12, 23, 0, 0, 0)
    const d1 = new Date(1985, 5, 13, 0, 30, 0, 0)

    const fd = Report.getFormattedEngagementDate({
      engagementDate: d0,
      duration: 90
    })
    expect(fd).toEqual(
      moment(d0).format(Report.getEngagementDateFormat()) +
        moment(d1).format(" >>> " + Report.getEngagementDateFormat())
    )
  })

  it("should not detect conflict for same report", () => {
    const report = new Report({ uuid: uuidv4() })
    expect(Report.hasConflict(report, report)).toStrictEqual(false)
  })

  it("should detect conflict when reports start at the same time", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    expect(Report.hasConflict(report01, report02)).toStrictEqual(true)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(true)
  })

  it("should detect conflict for all day reports even if reports do not start at the same time", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 12, 2, 0, 0, 0)
    })
    expect(Report.hasConflict(report01, report02)).toStrictEqual(true)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(true)
  })

  it("should not detect conflict for all day reports when reports are on different days", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      engagementDate: new Date(1985, 5, 13, 1, 0, 0, 0)
    })
    expect(Report.hasConflict(report01, report02)).toStrictEqual(false)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(false)
  })

  // r01:  |--------|
  // r02:              |--------|
  it("should not detect conflict when r01.end < r02.start", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 2, 0, 0, 0)
    })
    expect(tEnd(report01)).toBeLessThan(tStart(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(false)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(false)
  })

  // r01:  |--------|
  // r02:           |--------|
  it("should not detect conflict when r01.end === r02.start", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 30, 0, 0)
    })
    expect(tEnd(report01)).toStrictEqual(tStart(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(false)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(false)
  })

  // r01:  |--------|
  // r02:       |--------|
  it("should detect conflict when r01.end is between r02.start and r02.end && r01.start < r02.start", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 31,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 30, 0, 0)
    })
    expect(tEnd(report01)).toBeGreaterThan(tStart(report02))
    expect(tEnd(report01)).toBeLessThan(tEnd(report02))
    expect(tStart(report01)).toBeLessThan(tStart(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(true)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(true)
  })

  // r01:    |--------|
  // r02:  |------------|
  it("should detect conflict when r01.start and r01.end are between r02.start and r02.end ", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 90,
      engagementDate: new Date(1985, 5, 12, 0, 30, 0, 0)
    })
    expect(tEnd(report01)).toBeGreaterThan(tStart(report02))
    expect(tEnd(report01)).toBeLessThan(tEnd(report02))
    expect(tStart(report01)).toBeGreaterThan(tStart(report02))
    expect(tStart(report01)).toBeLessThan(tEnd(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(true)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(true)
  })

  // r01:       |--------|
  // r02:  |--------|
  it("should detect conflict when r01.start is between r02.start and r02.end && r01.end > r02.end ", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 60,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 60,
      engagementDate: new Date(1985, 5, 12, 0, 30, 0, 0)
    })
    expect(tStart(report01)).toBeGreaterThan(tStart(report02))
    expect(tStart(report01)).toBeLessThan(tEnd(report02))
    expect(tEnd(report01)).toBeGreaterThan(tEnd(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(true)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(true)
  })

  // r01:           |--------|
  // r02:  |--------|
  it("should not detect conflict when r01.start === r02.end", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 30, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    expect(tStart(report01)).toStrictEqual(tEnd(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(false)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(false)
  })

  // r01:              |--------|
  // r02:  |--------|
  it("should not detect conflict when r01.start > r02.end", () => {
    const report01 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 2, 0, 0, 0)
    })
    const report02 = new Report({
      uuid: uuidv4(),
      duration: 30,
      engagementDate: new Date(1985, 5, 12, 1, 0, 0, 0)
    })
    expect(tStart(report01)).toBeGreaterThan(tEnd(report02))
    expect(Report.hasConflict(report01, report02)).toStrictEqual(false)
    expect(Report.hasConflict(report02, report01)).toStrictEqual(false)
  })
})
