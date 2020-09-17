import * as layouts from "layouts"
import _groupBy from "lodash/groupBy"
import moment from "moment"

export const AGGREGATOR_TYPES = {
  [layouts.TYPES.GEO]: groupByLocation,
  [layouts.TYPES.MONTH]: groupByDay,
  [layouts.TYPES.YEAR]: groupByDay
}

export function groupByDay(inItems, dateField) {
  const uniqueKey = "date"
  const outItems = []
  // group items by same day in an object { day1: [item1, item2], day2: [item3, item4]}
  const tempItemsObj = _groupBy(inItems, item =>
    moment(item[dateField]).format("DD-MM-YYYY")
  )

  // convert that object to a list of objects
  tempItemsObj.keys().forEach(dayStr => {
    outItems.push({
      [uniqueKey]: dayStr,
      numOfEvents: tempItemsObj[dayStr].length
    })
  })

  return [outItems, uniqueKey]
}
export function groupByLocation() {}
