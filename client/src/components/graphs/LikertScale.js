import { TRAFFIC_LIGHTS_LEVELS } from "components/graphs/utils"
import * as d3 from "d3"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"
import Text from "react-svg-text"
import useDimensions from "react-use-dimensions"
import utils from "utils"

const LikertScale = ({
  onChange,
  value,
  values,
  levels,
  width,
  height,
  editable,
  whenUnspecified
}) => {
  const cursorRef = useRef(null)
  const axisRef = useRef(null)
  const [containerRef, containerBox] = useDimensions()
  const containerHeight = containerBox.height || 0
  const containerWidth = containerBox.width || 0
  const containerX = containerBox.x || 0
  const MARGIN_LEFT = editable ? 25 : 13
  const MARGIN_RIGHT = 13
  const scaleYPosition = containerHeight - 30
  const scale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([MARGIN_LEFT, containerWidth - MARGIN_RIGHT])
  const x = utils.isNumeric(value) ? scale(value) : MARGIN_LEFT / 2

  const calculateNewX = useCallback(
    eventX => {
      return Math.min(
        Math.max(eventX, scale.range()[0] - MARGIN_LEFT / 2),
        scale.range()[1]
      )
    },
    [scale, MARGIN_LEFT]
  )

  const xToValue = useCallback(
    newX => (newX >= scale.range()[0] ? scale.invert(newX) : null),
    [scale]
  )

  useEffect(() => {
    if (!editable) {
      return
    }
    const handleDrag = d3.drag().on("drag", (event, d) => {
      const me = d3.select(cursorRef.current)
      const newX = calculateNewX(event.x)
      me.attr("transform", `translate(${newX} ${scaleYPosition})`)
      onChange(xToValue(newX))
    })
    handleDrag(d3.select(cursorRef.current))
  }, [
    onChange,
    scale,
    scaleYPosition,
    editable,
    MARGIN_LEFT,
    calculateNewX,
    xToValue
  ])

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

  let activeColor = null
  let valuesStats = null
  const numberValues = utils.arrayOfNumbers(values)
  if (numberValues !== undefined && _isEmpty(numberValues)) {
    return whenUnspecified
  }
  if (numberValues?.length) {
    valuesStats = {
      min: Math.min(...numberValues),
      max: Math.max(...numberValues),
      avg: numberValues.reduce((a, b) => a + b, 0) / numberValues.length
    }
    valuesStats.avgColor = levels.find(
      level => level.endValue > valuesStats.avg
    )?.color
  }
  return (
    <svg
      height={height}
      width={width}
      ref={containerRef}
      onClick={e => {
        if (editable && e.clientX) {
          const newX = calculateNewX(e.clientX - containerX)
          onChange(xToValue(newX))
        }
      }}
    >
      {levels.map((level, index) => {
        const startX = scale(index === 0 ? 0 : levels[index - 1].endValue)
        const endX = scale(level.endValue)
        const active = x <= endX && (x > startX || index === 0)
        const fillColor = d3.color(level.color)
        active && (activeColor = d3.hsl(level.color))
        fillColor.opacity = active ? 0.4 : 0.15
        return (
          <React.Fragment key={`level-${index}`}>
            <rect
              style={{ fill: fillColor, stroke: "gray", strokeWidth: 1 }}
              y={0}
              x={startX}
              height={Math.max(0, containerHeight - 11)}
              width={Math.max(0, endX - startX)}
            />
            <Text
              fill={active ? "black" : "gray"}
              fontWeight={active ? "bold" : "normal"}
              x={startX + 2}
              y={2}
              style={{ pointerEvents: "none" }}
              width={endX - startX - 4}
              verticalAnchor="start"
            >
              {level.label}
            </Text>
          </React.Fragment>
        )
      })}
      {numberValues?.map((xValue, index) => (
        <g
          transform={`translate(${scale(xValue)} ${scaleYPosition})`}
          key={`values-${index}-${xValue}`}
        >
          <path
            d="M -10,-10 L 10,10 M 10,-10 L -10,10"
            style={{
              stroke: "black",
              fill: "black",
              strokeWidth: 2
            }}
          />
        </g>
      ))}

      {numberValues?.length > 1 && (
        <g transform={`translate(0 ${scaleYPosition})`}>
          <line
            x1={scale(valuesStats.min)}
            y1={-15}
            x2={scale(valuesStats.min)}
            y2={15}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.max)}
            y1={-15}
            x2={scale(valuesStats.max)}
            y2={15}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.min)}
            y1={0}
            x2={scale(valuesStats.max)}
            y2={0}
            style={{ stroke: "black", strokeWidth: 3 }}
          />
        </g>
      )}

      {numberValues?.length > 0 && (
        <g transform={`translate(0 ${scaleYPosition})`}>
          <circle
            cx={scale(valuesStats.avg)}
            r={10}
            style={{
              stroke: valuesStats.avgColor,
              strokeWidth: 7
            }}
          />
          <text
            x={scale(valuesStats.avg) - 22}
            y={25}
            style={{ pointerEvents: "none" }}
          >
            avg: {valuesStats.avg.toFixed(value < scale.domain()[1] ? 1 : 0)}
          </text>
        </g>
      )}
      <g ref={axisRef} transform={`translate(0 ${scaleYPosition})`} />

      {onChange && (editable || (value && value >= scale.domain()[0])) && (
        <g ref={cursorRef}>
          <polygon
            points="0,0 13,13 13,30 -13,30 -13,13"
            style={{
              stroke: "gray",
              fill: "" + activeColor,
              strokeWidth: 1,
              cursor: editable ? "pointer" : null
            }}
          />
          <text
            fill={activeColor?.l < 0.5 ? "white" : "black"}
            fontWeight="bold"
            x={-11}
            y={25}
            style={{ pointerEvents: "none" }}
          >
            {utils.isNumeric(value) && value >= scale.domain()[0]
              ? value.toFixed(value < scale.domain()[1] ? 1 : 0)
              : null}
          </text>
        </g>
      )}
    </svg>
  )
}

LikertScale.propTypes = {
  value: PropTypes.number,
  values: PropTypes.arrayOf(PropTypes.number),
  onChange: utils.fnRequiredWhen.bind(null, "editable"),
  levels: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      endValue: PropTypes.number.isRequired,
      tooltip: PropTypes.string,
      label: PropTypes.string
    })
  ).isRequired,
  width: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  editable: PropTypes.bool,
  whenUnspecified: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

LikertScale.defaultProps = {
  value: null,
  levels: TRAFFIC_LIGHTS_LEVELS,
  height: "65",
  width: "100%",
  editable: false,
  whenUnspecified: null
}

export default LikertScale
