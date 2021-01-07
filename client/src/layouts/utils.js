import * as LayoutHeaders from "components/LayoutHeader"
import _groupBy from "lodash/groupBy"
import moment from "moment"
import * as d3 from "d3"

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

export function groupByLocation(inItems) {
  const reducer = (clusters, currentItem) => {
    for (const cluster of clusters) {
      for (const clusterItem of cluster.items) {
        if (
          d3.geoDistance(clusterItem.coordinates, currentItem.coordinates) <
          0.01
        ) {
          cluster.items.push(currentItem)
          return clusters
        }
      }
    }
    clusters.push({
      coordinates: currentItem.coordinates,
      items: [currentItem]
    })
    return clusters
  }
  return [inItems.reduce(reducer, []), "coordinates"]
}
