import * as changeCase from "change-case"
import moment from "moment"
import { isNullOrUndefined } from "./utils_global_prototype_overwrites"

const REPORT_TIME_OUT = {
  dur: 2,
  unit: "mins"
}

export const REPORT_CONTROL_PERIOD_IN_MS = 30_000

export function reportTimedOut(reportData) {
  if (!reportData?.createdAt) {
    console.warn("Timeout calculation without a report or timestamp!")
    console.dir("reportData")
    console.dir(reportData)
    console.dir("reportData.createdAt")
    console.dir(reportData.createdAt)
    return
  }
  const diffInHours = moment().diff(
    reportData.createdAt,
    REPORT_TIME_OUT.unit,
    true
  )
  return diffInHours > REPORT_TIME_OUT.dur
}

// Support null input like change-case v3 did…
const wrappedChangeCase = {}
Object.keys(changeCase)
  .filter(c => c.endsWith("Case"))
  .forEach(c => {
    wrappedChangeCase[c] = (input, options) =>
      !input ? "" : changeCase[c](input, options)
  })

export default {
  ...wrappedChangeCase,
  isNullOrUndefined
}
