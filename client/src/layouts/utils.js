import DateChart from "components/DateChart"
import GeoChart from "components/GeoChart"
import * as LayoutHeaders from "components/LayoutHeader"
import _groupBy from "lodash/groupBy"
import moment from "moment"

export const LAYOUT_TYPES = {
  YEAR: "year",
  MONTH: "month",
  GEO: "geo"
}

export const DATE_LAYOUT_FORMAT = "DD-MM-YYYY"

export const LAYOUT_AGGREGATORS = {
  [LAYOUT_TYPES.GEO]: groupByLocation,
  [LAYOUT_TYPES.MONTH]: groupByDay,
  [LAYOUT_TYPES.YEAR]: groupByDay
}

export const LAYOUT_CHART_ELEMENTS = {
  [LAYOUT_TYPES.GEO]: GeoChart,
  [LAYOUT_TYPES.MONTH]: DateChart,
  [LAYOUT_TYPES.YEAR]: DateChart
}

export const INIT_LAYOUT_STATES = {
  // FIXME: Add default location when ready
  [LAYOUT_TYPES.GEO]: {},
  [LAYOUT_TYPES.MONTH]: moment(),
  [LAYOUT_TYPES.YEAR]: moment()
}

export const LAYOUT_HEADERS = {
  [LAYOUT_TYPES.GEO]: LayoutHeaders.GeoHeader,
  [LAYOUT_TYPES.MONTH]: LayoutHeaders.MonthHeader,
  [LAYOUT_TYPES.YEAR]: LayoutHeaders.YearHeader
}

export function groupByDay(inItems) {
  const aggregationKey = "date"
  const outItems = []
  // group items by same day in an object { day1: [item1, item2], day2: [item3, item4]}
  const tempItemsObj = _groupBy(inItems, item =>
    moment(item[aggregationKey]).format(DATE_LAYOUT_FORMAT)
  )

  // aggregate from that object to a list of objects
  Object.keys(tempItemsObj).forEach(dayStr => {
    outItems.push({
      aggregationKey,
      [aggregationKey]: dayStr,
      numOfEvents: tempItemsObj[dayStr].length
    })
  })

  return [outItems, aggregationKey]
}
export function groupByLocation() {}
