import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import PropTypes from "prop-types"

const LikertScale = ({ onChange, value, levels, size }) => {
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const cursorRef = useRef(null)

  const MARGIN = 20
  const scaleYPosition = size.height - 30
  const screenToValue = x => ((x - MARGIN) * 100) / (size.width - 2 * MARGIN)
  const valueToScreen = value =>
    (value * (size.width - 2 * MARGIN)) / 100 + MARGIN
  const x = valueToScreen(Number(value !== undefined ? value : 50))

  useEffect(() => {
    const handleDrag = d3.drag().on("drag", function() {
      const me = d3.select(cursorRef.current)
      const newX = Math.min(
        Math.max(d3.event.x, valueToScreen(0)),
        valueToScreen(100)
      )
      me.attr("transform", `translate(${newX} ${scaleYPosition})`)
      onChange(screenToValue(newX))
    })
    handleDrag(d3.select(cursorRef.current))
  }, [onChange])

  useEffect(() => {
    d3.select(cursorRef.current).attr(
      "transform",
      `translate(${x} ${scaleYPosition})`
    )
  }, [x, scaleYPosition])

  return (
    <svg
      height={size.height}
      width={size.width}
      viewBox={`0 0 ${size.width} ${size.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {levels.map((level, index) => {
        const startX = valueToScreen(
          index === 0 ? 0 : levels[index - 1].endValue
        )
        const endX = valueToScreen(level.endValue)
        const active = x <= endX && x > startX
        return (
          <>
            <rect
              style={{ fill: level.color, strokeWidth: 0 }}
              y={0}
              x={startX}
              height={size.height}
              width={endX - startX}
              key={`level-${index}`}
            />
            <text
              fill={active ? "black" : "gray"}
              x={startX}
              y={MARGIN}
              style={{ pointerEvents: "none" }}
            >
              {level.label}
            </text>
          </>
        )
      })}
      )}
      {ticks.map(tick => (
        <rect
          style={{ fill: "gray", strokeWidth: 0 }}
          y={scaleYPosition}
          x={valueToScreen(tick) - 1}
          height={5}
          width={3}
          key={`tick-${tick}`}
        />
      ))}
      <g ref={cursorRef}>
        <polygon
          points="0,0 13,13 13,30 -13,30 -13,13"
          style={{ stroke: "blue", fill: "white", strokeWidth: 1 }}
        />
        <text fill="blue" x={-10} y={25} style={{ pointerEvents: "none" }}>
          {(Math.floor(value) / 10).toFixed(value < 100 ? 1 : 0)}
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
      color: "#ff6557",
      endValue: 30
    },
    {
      color: "#ffde85",
      endValue: 70
    },
    {
      color: "#afffa6",
      endValue: 100
    }
  ],
  size: {
    height: 65,
    width: 325
  }
}

export default LikertScale
