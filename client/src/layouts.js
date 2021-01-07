import geoLayout from "layouts/geoLayout"
import monthLayout from "layouts/monthLayout"
import { LAYOUT_TYPES } from "layouts/utils"
import yearLayout from "layouts/yearLayout"
import * as d3 from "d3"

const LAYOUTS = {
  [LAYOUT_TYPES.GEO]: geoLayout(
    d3.geoMercator().fitSize([1000, 500], {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [45, 5],
                [55, 5],
                [55, 15],
                [45, 15]
              ]
            ]
          }
        }
      ]
    })
  ),
  [LAYOUT_TYPES.MONTH]: monthLayout,
  [LAYOUT_TYPES.YEAR]: yearLayout
}

export default LAYOUTS
