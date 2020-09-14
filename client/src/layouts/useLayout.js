import * as layouts from "layouts"
import { useMemo } from "react"
import useDimensions from "react-use-dimensions"

const useLayout = ({ layoutType }) => {
  const [ref, dimensions] = useDimensions()
  const layout = useMemo(() => {
    let layoutTemp
    switch (layoutType) {
      case layouts.TYPES.YEAR:
        layoutTemp = layouts.yearLayout
        break
      case layouts.TYPES.MONTH:
        layoutTemp = layouts.monthLayout
        break
      case layouts.TYPES.GEO:
        layoutTemp = layouts.geoLayout
        break
      default:
        layoutTemp = layouts.yearLayout
        break
    }
    return item => layoutTemp(item, dimensions)
  }, [layoutType, dimensions])

  return [ref, layout]
}

export default useLayout
