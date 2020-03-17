import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import PropTypes from "prop-types"
import Text from "react-svg-text"
import useDimensions from "react-use-dimensions"

const LikertScale = ({
  onChange,
  value,
  values,
  levels,
  width,
  height,
  readonly
}) => {
  const cursorRef = useRef(null)
  const axisRef = useRef(null)
  const [containerRef, containerBox] = useDimensions()
  const containerHeight = containerBox.height || 0
  const containerWidth = containerBox.width || 0
  const containerX = containerBox.x || 0
  const MARGIN = 20
  const scaleYPosition = containerHeight - 30

  const scale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([MARGIN, containerWidth - 2 * MARGIN])
  const x = scale(Number(value !== undefined ? value : 50))

  useEffect(() => {
    if (readonly) {
      return
    }
    const handleDrag = d3.drag().on("drag", function() {
      const me = d3.select(cursorRef.current)
      const newX = Math.min(
        Math.max(d3.event.x, scale.range()[0]),
        scale.range()[1]
      )
      me.attr("transform", `translate(${newX} ${scaleYPosition})`)
      onChange(scale.invert(newX))
    })
    handleDrag(d3.select(cursorRef.current))
  }, [onChange, scale, scaleYPosition, readonly])

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
  if (values?.length) {
    valuesStats = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    }
    valuesStats.avgColor =
      valuesStats &&
      levels.find(level => level.endValue > valuesStats.avg)?.color
  }

  return (
    <svg
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      ref={containerRef}
      onClick={e =>
        !readonly && e.clientX && onChange(scale.invert(e.clientX - containerX))}
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
      {values?.map((xValue, index) => (
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

      {values?.length > 1 && (
        <g transform={`translate(0 ${scaleYPosition})`}>
          <line
            x1={scale(valuesStats.min)}
            y1="-15"
            x2={scale(valuesStats.min)}
            y2="15"
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.max)}
            y1="-15"
            x2={scale(valuesStats.max)}
            y2="15"
            style={{ stroke: "black", strokeWidth: 3 }}
          />
          <line
            x1={scale(valuesStats.min)}
            y1="0"
            x2={scale(valuesStats.max)}
            y2="0"
            style={{ stroke: "black", strokeWidth: 3 }}
          />
        </g>
      )}

      {values?.length > 0 && (
        <g transform={`translate(0 ${scaleYPosition})`}>
          <circle
            cx={scale(valuesStats.avg)}
            r="10"
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
            avg:{" "}
            {Number(valuesStats.avg).toFixed(value < scale.domain()[1] ? 1 : 0)}
          </text>
        </g>
      )}
      <g ref={axisRef} transform={`translate(0 ${scaleYPosition})`} />

      {onChange && (
        <g ref={cursorRef}>
          <polygon
            points="0,0 13,13 13,30 -13,30 -13,13"
            style={{
              stroke: "gray",
              fill: "" + activeColor,
              strokeWidth: 1,
              cursor: readonly ? null : "pointer"
            }}
          />
          <text
            fill={activeColor?.l < 0.5 ? "white" : "black"}
            fontWeight="bold"
            x={-11}
            y={25}
            style={{ pointerEvents: "none" }}
          >
            {Number(value).toFixed(value < scale.domain()[1] ? 1 : 0)}
          </text>
        </g>
      )}
    </svg>
  )
}

LikertScale.propTypes = {
  value: PropTypes.number,
  values: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
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
  readonly: PropTypes.bool
}

LikertScale.defaultProps = {
  value: 0,
  levels: [
    {
      color: "red",
      endValue: 3
    },
    {
      color: "#FFBF00",
      endValue: 7
    },
    {
      color: "green",
      endValue: 10
    }
  ],
  height: "65",
  width: "100%"
}

export default LikertScale
