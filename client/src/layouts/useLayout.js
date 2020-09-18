import LAYOUTS from "layouts"
import { INIT_LAYOUT_STATES, LAYOUT_CHART_ELEMENTS } from "layouts/utils"
import { useMemo } from "react"
import useDimensions from "react-use-dimensions"

const useLayout = (layoutType, aggregationKey) => {
  const [ref, dimensions] = useDimensions()
  const vars = useMemo(() => {
    const chartElement = LAYOUT_CHART_ELEMENTS[layoutType]
    const specificLayout = LAYOUTS[layoutType]
    const initViewState = INIT_LAYOUT_STATES[layoutType]
    // we will cal the layout with item and args related to that layout (e.g selectedDate for date layouts, map location for geo layout)
    const layout = (item, viewArgs) => {
      return !dimensions?.width || !dimensions?.height
        ? null
        : specificLayout(item, dimensions, viewArgs)
    }

    return [chartElement, layout, initViewState]
  }, [layoutType, dimensions, aggregationKey])

  return [...vars, ref]
}

export default useLayout
