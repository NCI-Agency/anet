import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import PropTypes from "prop-types"

const MARGIN = 20
const HEIGHT = 65
const WIDTH = 325
const CENTER_Y = HEIGHT * 0.3
const MIN_X = MARGIN
const MAX_X = WIDTH - MARGIN
const screenToValue = x => ((x - MIN_X) * 100) / (MAX_X - MIN_X)
const valueToScreen = value => (value * (MAX_X - MIN_X)) / 100 + MIN_X

const Cursor = props => {
  const d3Ref = useRef(null)
  const { onValueChange, value } = props
  useEffect(() => {
    const handleDrag = d3.drag().on("drag", function() {
      const me = d3.select(d3Ref.current)
      const newX = Math.min(Math.max(d3.event.x, MIN_X), MAX_X)
      me.attr("transform", `translate(${newX} ${CENTER_Y})`)
      onValueChange(newX)
    })
    handleDrag(d3.select(d3Ref.current))
  }, [onValueChange])

  useEffect(() => {
    d3.select(d3Ref.current).attr(
      "transform",
      `translate(${value} ${CENTER_Y})`
    )
  }, [value])

  return (
    <g ref={d3Ref}>
      <polygon
        points="0,0 10,13 -10,13"
        style={{ fill: "blue", strokeWidth: 0 }}
      />
      <text fill="blue" x={-10}>
        {(Math.floor(screenToValue(value)) / 10).toFixed(1)}
      </text>
    </g>
  )
}

Cursor.propTypes = {
  onValueChange: PropTypes.func,
  value: PropTypes.number
}

const LikertScale = props => {
  const { onChange, value, levels } = props
  const x = valueToScreen(Number(value !== undefined ? value : 50))
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  return (
    <div>
      <svg
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        xmlns="http://www.w3.org/2000/svg"
      >
        {levels.map((level, index) => {
          const startX = valueToScreen(
            index === 0 ? 0 : levels[index - 1].endValue
          )
          return (
            <>
              <rect
                style={{ fill: level.color, strokeWidth: 0 }}
                y={0}
                x={startX}
                height={HEIGHT}
                width={valueToScreen(level.endValue) - startX}
                key={`level-${index}`}
              />
              <text fill="gray" x={startX} y={CENTER_Y + 25}>
                {level.label}
              </text>
            </>
          )
        })}
        )}
        <text fill="gray" x={(MAX_X * 2) / 3 + 5} y={CENTER_Y + 25}>
          Criteria 3
        </text>
        {ticks.map(tick => (
          <rect
            style={{ fill: "gray", strokeWidth: 0 }}
            y={CENTER_Y}
            x={valueToScreen(tick) - 1}
            height={5}
            width={3}
            key={`tick-${tick}`}
          />
        ))}
        <Cursor value={x} onValueChange={x => onChange(screenToValue(x))} />
      </svg>
    </div>
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
  ).isRequired
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
  ]
}

export default LikertScale
