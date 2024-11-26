import memoize from "lodash/memoize"
import React, { useEffect, useState } from "react"
import reduceCSSCalc from "reduce-css-calc"

const MEASUREMENT_ELEMENT_ID = "svg-text-measurement-id"

interface SvgTextProps {
  x?: number
  y?: number
  dx?: number
  dy?: number
  width?: number
  lineHeight?: string
  capHeight?: string
  verticalAnchor?: "start" | "middle" | "end"
  textAnchor?: "start" | "middle" | "end" | "inherit"
  style?: any
  children?: React.ReactNode
}

const SvgText = ({
  x = 0,
  y = 0,
  dx = 0,
  dy = 0,
  width,
  lineHeight = "1em",
  capHeight = "0.71em", // Magic number from d3
  verticalAnchor = "end",
  textAnchor = "start",
  style,
  children,
  ...textProps
}: SvgTextProps) => {
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
