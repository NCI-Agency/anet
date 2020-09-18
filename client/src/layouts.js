import geoLayout from "layouts/geoLayout"
import monthLayout from "layouts/monthLayout"
import { LAYOUT_TYPES } from "layouts/utils"
import yearLayout from "layouts/yearLayout"

const LAYOUTS = {
  [LAYOUT_TYPES.GEO]: geoLayout,
  [LAYOUT_TYPES.MONTH]: monthLayout,
  [LAYOUT_TYPES.YEAR]: yearLayout
}

export default LAYOUTS
