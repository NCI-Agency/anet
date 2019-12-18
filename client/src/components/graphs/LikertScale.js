import React, { useState } from "react"
import posed from "react-pose"
import PropTypes from "prop-types"

const MARGIN = 4
const HEIGHT = 45
const WIDTH = 225
const CENTER_X = WIDTH * 0.5
const CENTER_Y = HEIGHT * 0.5
const START_X = MARGIN
const END_X = WIDTH - MARGIN

const MIN_X = -CENTER_X + MARGIN * 2
const MAX_X = CENTER_X - MARGIN * 2

const SliderKnob = posed.circle({
  draggable: true,
  dragBounds: {
    left: MIN_X,
    top: -CENTER_Y + MARGIN * 2,
    bottom: CENTER_Y - MARGIN * 2,
    right: MAX_X
  },
  dragEnd: {
    y: 0,
    transition: { type: "spring", damping: 80, stiffness: 300 }
  }
})

export default function LikertScale(props) {
  console.log(`vvvvvvvvvvvv ${(props.value || 0) / 100}`)
  const [x, setX] = useState(
    ((props.value || 50) * (MAX_X - MIN_X)) / 100 + MIN_X
  )
  const [y, setY] = useState(0)

  console.log(`xxxxx ${x}`)

  const onXChange = v => {
    setX(v + CENTER_X)
    props.onChange(
      Math.floor(((v - MIN_X) * 100) / (MAX_X - MIN_X) - MARGIN + 1)
    )
  }

  const onYChange = v => setY(v + CENTER_Y)

  return (
    <div>
      <svg
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        xmlns="http://www.w3.org/2000/svg"
      >
        {props.background &&
        <>
        <rect
          style={{ fill: "#ff8888", strokeWidth: 0 }}
          y="0"
          x="0"
          height={HEIGHT}
          width={END_X / 3}
          id="rect3713"
        />
        <rect
          style={{ fill: "#ffffab", strokeWidth: 0 }}
          y="0"
          x={END_X / 3}
          height={HEIGHT}
          width={(END_X * 2) / 3}
          id="rect3713"
        />
        <rect
          style={{ fill: "#9ef39e", strokeWidth: 0 }}
          y="0"
          x={(END_X * 2) / 3}
          height={HEIGHT}
          width={END_X}
          id="rect3713"
        />
        </>
        }

        <g fill="none" fillRule="evenodd">
          <path
            d={`
          M ${START_X},${CENTER_Y}
          S ${(x - START_X) * 0.5},${y}
            ${x},${y}
          `}
            stroke="gray"
            strokeWidth="1"
          />
          <path
            d={`
          M ${x},${y}
          S ${x + (END_X - x) * 0.5},${y}
            ${END_X},${CENTER_Y}
        `}
            stroke="gray"
            strokeWidth="1"
          />
          <SliderKnob
            cx={CENTER_X}
            cy={CENTER_Y}
            r="7"
            fill="black"
            onValueChange={{ x: onXChange, y: onYChange }}
          />
        </g>
        <text fill="gray" x={x - 5} y={CENTER_Y + 20}>
          {Math.floor((x * 100) / (MAX_X - MIN_X) - MARGIN + 1)}
        </text>
      </svg>
    </div>
  )
}

LikertScale.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  background: PropTypes.bool
}
