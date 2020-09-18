import geoLayout from "layouts/geoLayout"
import monthLayout from "layouts/monthLayout"
import yearLayout from "layouts/yearLayout"

export const LAYOUT_TYPES = {
  YEAR: "year",
  MONTH: "month",
  GEO: "geo"
}

const LAYOUTS = {
  [LAYOUT_TYPES.GEO]: geoLayout,
  [LAYOUT_TYPES.MONTH]: monthLayout,
  [LAYOUT_TYPES.YEAR]: yearLayout
}

export default LAYOUTS
