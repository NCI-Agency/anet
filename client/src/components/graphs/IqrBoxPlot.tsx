import { TRAFFIC_LIGHTS_LEVELS } from "components/graphs/utils"
import * as d3 from "d3"
import _isEmpty from "lodash/isEmpty"
import React, { useEffect, useRef } from "react"
import { useResizeDetector } from "react-resize-detector"

interface IqrBoxPlotProps {
  values?: number[]
  levels: {
    color?: string
    endValue: number
    tooltip?: string
    label?: string
  }[]
  width: string
  height: string
  whenUnspecified?: string | any
}

const IqrBoxPlot = ({
  values,
  levels = TRAFFIC_LIGHTS_LEVELS,
  width = "100%",
  height = "65",
  whenUnspecified = null
}: IqrBoxPlotProps) => {
  const cursorRef = useRef(null)
  const axisRef = useRef(null)
  const {
    width: containerBoxWidth,
    height: containerBoxHeight,
    ref: containerRef
  } = useResizeDetector()
  const containerHeight = containerBoxHeight ?? 0
  const containerWidth = containerBoxWidth ?? 0
  const MARGIN = 13
  const scaleYPosition = containerHeight - 30

  const sortedValues = values.sort((a, b) => a - b)
  const valuesStats = {
    min: Math.min(...values),
    max: Math.max(...values),
    q1: getQuartile(sortedValues, 1),
    q2: getQuartile(sortedValues, 2),
    q3: getQuartile(sortedValues, 3)
  }

  function getQuartile(sortedData, quartileNumber) {
    const index = quartileNumber * (sortedData.length / 4)
    const idx = Math.floor(index)
    return idx === index
      ? (sortedData[idx - 1] + sortedData[idx]) / 2
      : sortedData[idx]
  }

  const scale = d3
    .scaleLinear()
    .domain([valuesStats.min, valuesStats.max])
    .range([MARGIN, containerWidth - 2 * MARGIN])
  const x = scale(50)

  useEffect(() => {
    d3.select(cursorRef.current).attr(
      "transform",
      `translate(${x} ${scaleYPosition})`
    )
  }, [x, scaleYPosition])

  useEffect(() => {
    const axis = d3.axisBottom(scale)
    d3.select(axisRef.current).call(axis)
  }, [scale])

  const fillColor = d3.color("lightGray")
  fillColor.opacity = 0.4

  if (_isEmpty(values)) {
    return whenUnspecified
  }
  return (
    <svg height={height} width={width} ref={containerRef}>
      {values?.length > 1 && (
        <g transform={`translate(0 ${scaleYPosition})`}>
          <line
            x1={scale(valuesStats.min)}
            y1={0}
            x2={scale(valuesStats.q1)}
            y2={0}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.q1)}
            y1={-15}
            x2={scale(valuesStats.q1)}
            y2={15}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.q2)}
            y1={-15}
            x2={scale(valuesStats.q2)}
            y2={15}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.q3)}
            y1={-15}
            x2={scale(valuesStats.q3)}
            y2={15}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.q1)}
            y1={0}
            x2={scale(valuesStats.q3)}
            y2={0}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.q3)}
            y1={0}
            x2={scale(valuesStats.max)}
            y2={0}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
        </g>
      )}
      <g ref={axisRef} transform={`translate(0 ${scaleYPosition})`} />
    </svg>
  )
}

export default IqrBoxPlot
