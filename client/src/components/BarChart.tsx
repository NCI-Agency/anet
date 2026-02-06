import * as d3 from "d3"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import React, { useEffect, useRef } from "react"
import utils from "utils"
import "./BarChart.css"
import { addD3Tooltip } from "./D3Tooltip"

/*
 * Given an object and a property of the type prop1.prop2.prop3,
 * return obj[prop1][prop2][prop3]
 */
function getPropValue(obj, prop) {
  const defaultValue = "<undefined>"
  if (Array.isArray(prop)) {
    return _get(obj, prop[0], prop[1] || defaultValue)
  } else {
    return _get(obj, prop, defaultValue)
  }
}

interface BarChartProps {
  width?: number | string
  height?: number | string
  chartId?: string
  data?: any[]
  xProp: string | string[]
  yProp: string | string[]
  xLabel?: string | string[]
  xPadding?: number
  barClass?: string
  onBarClick?: (...args: unknown[]) => unknown
  tooltip?: (...args: unknown[]) => unknown
  selectedBarClass?: string
  selectedBar?: string
}

const BarChart = ({
  width = "100%",
  height,
  chartId,
  data,
  xProp, // data property to use for the x-axis domain
  yProp, // data property to use for the y-axis domain
  xLabel, // data property to use for the x-axis ticks label
  xPadding = 0.1,
  barClass = "bars-group",
  onBarClick,
  tooltip,
  selectedBarClass = "selected-bar",
  selectedBar = ""
}: BarChartProps) => {
  const node = useRef(null)
  useEffect(() => {
    if (!node.current) {
      return
    }
    const MARGIN = {
      top: 20,
      right: 20,
      left: 40,
      bottom: 0 // left and bottom MARGINs are dynamic, these are extra margins
    }
    const label = xLabel || xProp
    const xLabels = {} // dict containing x-value and corresponding tick label

    const xScale = d3.scaleBand().domain(
      data.map(function (d) {
        xLabels[getPropValue(d, xProp)] = utils.ellipsize(
          // TODO: Make responsive
          getPropValue(d, label),
          10
        )
        return getPropValue(d, xProp)
      })
    )
    const yMax = d3.max(data, function (d) {
      return getPropValue(d, yProp)
    })
    const yScale = d3.scaleLinear().domain([0, yMax])

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    const tmpSVG = d3.select("#tmp_svg").data([1]).enter().append("svg")
    const xText = function (d) {
      return xLabels[getPropValue(d, xProp)]
    }
    const yText = function (d) {
      return getPropValue(d, yProp)
    }
    const xLabelWidth = function () {
      if (this.getBBox().width > maxXLabelWidth) {
        maxXLabelWidth = this.getBBox().width
      }
    }
    const yLabelWidth = function () {
      if (this.getBBox().width > maxYLabelWidth) {
        maxYLabelWidth = this.getBBox().width
      }
    }
    for (let i = 0; i < data.length; i++) {
      tmpSVG
        .selectAll(".get_max_width_x_label")
        .data(data)
        .enter()
        .append("text")
        .text(xText)
        .each(xLabelWidth)
        .remove()
      tmpSVG
        .selectAll(".get_max_width_y_label")
        .data(data)
        .enter()
        .append("text")
        .text(yText)
        .each(yLabelWidth)
        .remove()
    }
    tmpSVG.remove()

    // The left margin depends on the width of the y-axis labels.
    // We add extra margin to make sure that if the label is different because
    // of the automatic formatting the labels are still displayed on the chart.
    const marginLeft = maxYLabelWidth + MARGIN.left
    // The bottom margin depends on the width of the x-axis labels.
    const marginBottom = maxXLabelWidth + MARGIN.bottom

    let chart = d3.select(node.current)
    const chartBox = node.current.getBoundingClientRect()
    const chartWidth = utils.isNumeric(width) ? width : chartBox.width
    const chartHeight = utils.isNumeric(height) ? height : 0.7 * chartWidth
    const xWidth = chartWidth - marginLeft - MARGIN.right
    const yHeight = chartHeight - MARGIN.top - marginBottom

    xScale.rangeRound([0, xWidth]).padding(xPadding)
    yScale.range([yHeight, 0])

    const xAxis = d3.axisBottom(xScale).tickFormat(function (d) {
      return xLabels[d]
    })

    const yTicks = Math.min(yMax, 10)
    const yAxis = d3.axisLeft(yScale).ticks(yTicks, "d")

    chart.selectAll("*").remove()
    chart = chart
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${marginLeft}, ${MARGIN.top})`)

    chart
      .append("g")
      .attr("transform", `translate(0, ${yHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "start")
      .attr("dy", "0.35em")
      .attr("transform", "rotate(45)")

    chart.append("g").call(yAxis)

    const bar = chart
      .selectAll(`.${barClass}`)
      .data(data)
      .enter()
      .append("g")
      .classed(barClass, true)
      .append("rect")
      .attr("id", function (d) {
        return `bar_${getPropValue(d, xProp)}`
      })
      .classed(selectedBarClass, function () {
        return this.id === selectedBar
      })
      .attr("x", function (d) {
        return xScale(getPropValue(d, xProp))
      })
      .attr("y", function (d) {
        return yScale(getPropValue(d, yProp))
      })
      .attr("width", xScale.bandwidth())
      .attr("height", function (d) {
        return yHeight - yScale(getPropValue(d, yProp))
      })
    addD3Tooltip(bar, tooltip, !!onBarClick)
    if (onBarClick) {
      bar.on("click", (_, d) => onBarClick(d))
    }
  }, [
    node,
    width,
    height,
    chartId,
    data,
    xProp,
    yProp,
    xLabel,
    barClass,
    onBarClick,
    tooltip,
    selectedBarClass,
    selectedBar
  ])

  return (
    (_isEmpty(data) && (
      <div>
        <em>No data</em>
      </div>
    )) || <svg id={chartId} ref={node} width={width} height={height} />
  )
}

export default BarChart
