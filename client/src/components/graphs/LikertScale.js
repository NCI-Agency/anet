import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import PropTypes from "prop-types"
import Text from "react-svg-text"
import useDimensions from "react-use-dimensions"

const LikertScale = ({ onChange, value, levels, width, height, readonly }) => {
  const cursorRef = useRef(null)
  const axisRef = useRef(null)
  const [containerRef, containerBox] = useDimensions()

  const MARGIN = 20
  const scaleYPosition = containerBox.height - 30

  const scale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([MARGIN, containerBox.width - 2 * MARGIN])
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

  return (
    <svg
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      ref={containerRef}
      onClick={e =>
        e.clientX && onChange(scale.invert(e.clientX - containerBox.x))}
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
              height={containerBox.height - 11}
              width={endX - startX}
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
      )}
      <g ref={axisRef} transform={`translate(0 ${scaleYPosition})`} />
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
    </svg>
  )
}

LikertScale.propTypes = {
  value: PropTypes.number,
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
