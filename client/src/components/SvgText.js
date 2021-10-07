import memoize from "lodash/memoize"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import reduceCSSCalc from "reduce-css-calc"

const MEASUREMENT_ELEMENT_ID = "svg-text-measurement-id"

const SvgText = ({
  x,
  y,
  dx,
  dy,
  width,
  lineHeight,
  capHeight,
  verticalAnchor,
  textAnchor,
  style,
  children,
  ...textProps
}) => {
  const [wordsByLines, setWordsByLines] = useState([])
  useEffect(() => {
    const calculatedWidths = calculateWordWidths(children, style)
    setWordsByLines(
      calculateWordByLines(
        calculatedWidths.wordsWithComputedWidth,
        calculatedWidths.spaceWidth,
        width
      )
    )
  }, [children, style, width])
  return (
    <text
      x={x + dx}
      y={y + dy}
      textAnchor={textAnchor}
      style={style}
      {...textProps}
    >
      {wordsByLines.map((line, index) => (
        <tspan
          x={x + dx}
          dy={
            index === 0
              ? getStartDy(verticalAnchor, capHeight, wordsByLines, lineHeight)
              : lineHeight
          }
          key={index}
        >
          {line.words.join(" ")}
        </tspan>
      ))}
    </text>
  )
}

SvgText.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  dx: PropTypes.number,
  dy: PropTypes.number,
  width: PropTypes.number,
  lineHeight: PropTypes.string,
  capHeight: PropTypes.string,
  verticalAnchor: PropTypes.oneOf(["start", "middle", "end"]),
  textAnchor: PropTypes.oneOf(["start", "middle", "end", "inherit"]),
  style: PropTypes.object,
  children: PropTypes.node
}

SvgText.defaultProps = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  lineHeight: "1em",
  capHeight: "0.71em", // Magic number from d3
  textAnchor: "start",
  verticalAnchor: "end"
}

const getStartDy = (verticalAnchor, capHeight, wordsByLines, lineHeight) => {
  switch (verticalAnchor) {
    case "start":
      return reduceCSSCalc(`calc(${capHeight})`)
    case "middle":
      return reduceCSSCalc(
        `calc(${
          (wordsByLines.length - 1) / 2
        } * -${lineHeight} + (${capHeight} / 2))`
      )
    default:
      return reduceCSSCalc(`calc(${wordsByLines.length - 1} * -${lineHeight})`)
  }
}

const calculateWordByLines = (
  wordsWithComputedWidth,
  spaceWidth,
  lineWidth
) => {
  return wordsWithComputedWidth.reduce((wordsByLines, { word, width }) => {
    const currentLine = wordsByLines[wordsByLines.length - 1]
    if (
      currentLine &&
      (lineWidth === null || currentLine.width + width < lineWidth)
    ) {
      currentLine.words.push(word)
      currentLine.width += width + spaceWidth
    } else {
      const newLine = { words: [word], width }
      wordsByLines.push(newLine)
    }
    return wordsByLines
  }, [])
}

const calculateWordWidths = (children, style) => {
  const words = children ? children.toString().split(/\s+/) : []
  const wordsWithComputedWidth = words.map(word => ({
    word,
    width: getStringWidthMemoized(word, style)
  }))
  const spaceWidth = getStringWidthMemoized("\u00A0", style)
  return { wordsWithComputedWidth, spaceWidth }
}

const getStringWidth = (str, style) => {
  let textEl = document.getElementById(MEASUREMENT_ELEMENT_ID)
  if (!textEl) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    textEl = document.createElementNS("http://www.w3.org/2000/svg", "text")
    textEl.setAttribute("id", MEASUREMENT_ELEMENT_ID)
    svg.appendChild(textEl)
    document.body.appendChild(svg)
  }
  Object.assign(textEl.style, style)
  textEl.textContent = str
  return textEl.getComputedTextLength()
}

const getStringWidthMemoized = memoize(getStringWidth)

export default SvgText
