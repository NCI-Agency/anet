import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import PropTypes from "prop-types"

const LikertScale = ({ onChange, value, levels, size }) => {
  const cursorRef = useRef(null)
  const axisRef = useRef(null)

  const MARGIN = 20
  const scaleYPosition = size.height - 30
  const scale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([MARGIN, size.width - 2 * MARGIN])
  const x = scale(Number(value !== undefined ? value : 50))

  useEffect(() => {
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
  }, [onChange, scale, scaleYPosition, size])

  useEffect(() => {
    d3.select(cursorRef.current).attr(
      "transform",
      `translate(${x} ${scaleYPosition})`
    )
  }, [x, size, scaleYPosition])

  useEffect(() => {
    const axis = d3.axisBottom(scale)
    d3.select(axisRef.current).call(axis)
  }, [scale, size])

  let activeColor = null

  return (
    <svg
      height={size.height}
      width={size.width}
      viewBox={`0 0 ${size.width} ${size.height}`}
      xmlns="http://www.w3.org/2000/svg"
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
              height={size.height - 11}
              width={endX - startX}
            />
            <text
              fill={active ? "black" : "gray"}
              fontWeight={active ? "bold" : "normal"}
              x={startX + 5}
              y={MARGIN}
              style={{ pointerEvents: "none" }}
            >
              {level.label}
            </text>
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
            cursor: "pointer"
          }}
        />
        <text
          fill={activeColor.l < 0.5 ? "white" : "black"}
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
  size: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }).isRequired
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
  size: {
    height: 65,
    width: 500
  }
}

export default LikertScale
