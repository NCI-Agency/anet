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
    const layout = (item, viewArgs) => {
      return !dimensions?.width || !dimensions?.height
        ? null
        : specificLayout(item, dimensions, aggregationKey, viewArgs)
    }

    return [chartElement, layout, initViewState]
  }, [layoutType, dimensions, aggregationKey])

  return [...vars, ref]
}

export default useLayout
