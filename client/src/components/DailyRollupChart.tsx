import * as d3 from "d3"
import React, { useEffect, useRef } from "react"
import utils from "utils"
import "./BarChart.css"
import { addD3Tooltip } from "./D3Tooltip"

interface DailyRollupChartProps {
  width?: number | string
  chartId?: string
  data?: any[]
  onBarClick?: (...args: unknown[]) => unknown
  tooltip?: (...args: unknown[]) => unknown
  barColors: {
    cancelled: string
    published: string
    planned: string
  }
}

const DailyRollupChart = ({
  width,
  chartId,
  data,
  onBarClick,
  tooltip,
  barColors
}: DailyRollupChartProps) => {
  const node = useRef(null)
  useEffect(() => {
    if (!node.current) {
      return
    }
    const BAR_HEIGHT = 24
    const BAR_PADDING = 8
    const MARGIN = {
      top: 30,
      right: 20,
      left: 20,
      bottom: 20 // left and bottom MARGINs are dynamic, these are extra margins
    }
    const chartBox = node.current.getBoundingClientRect()
    const chartWidth = (utils.isNumeric(width) ? width : chartBox.width) - 30
    let chart = d3.select(node.current)
    const xLabels = [].concat.apply(
      [],
      data.map(d => d.published + d.planned + d.cancelled)
    )
    const yLabels = {}
    const yDomain = data.map(d => {
      yLabels[d.org.uuid] = d.org.shortName
      return d.org.uuid
    })

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    const tmpSVG = d3.select("#tmp_svg").data([1]).enter().append("svg")
    const xLabelWidth = function() {
      if (this.getBBox().width > maxXLabelWidth) {
        maxXLabelWidth = this.getBBox().width
      }
    }
    const yLabelWidth = function(d) {
      if (this.getBBox().width > maxYLabelWidth) {
        maxYLabelWidth = this.getBBox().width
      }
    }
    tmpSVG
      .selectAll(".get_max_width_x_label")
      .data(xLabels)
      .enter()
      .append("text")
      .text(d => d)
      .each(xLabelWidth)
      .remove()
    tmpSVG
      .selectAll(".get_max_width_y_label")
      .data(Object.values(yLabels))
      .enter()
      .append("text")
      .text(d => d)
      .each(yLabelWidth)
      .remove()
    tmpSVG.remove()

    // The left margin depends on the width of the y-axis labels.
    const marginLeft = maxYLabelWidth + MARGIN.left
    // The bottom margin depends on the width of the x-axis labels.
    const marginBottom = maxXLabelWidth + MARGIN.bottom
    const xWidth = chartWidth - marginLeft - MARGIN.right

    // We use a dynamic yHeight, depending on how much data we have to display,
    // in order to make sure the chart is readable for lots of data
    const yHeight = (BAR_HEIGHT + BAR_PADDING) * data.length
    const chartHeight = yHeight + MARGIN.top + marginBottom

    const xMax = d3.max(xLabels)
    const xScale = d3.scaleLinear().domain([0, xMax]).range([0, xWidth])

    const yScale = d3.scaleBand().domain(yDomain).range([0, yHeight])

    const xTicks = Math.min(xMax, 10)
    const xAxisTop = d3.axisTop().scale(xScale).ticks(xTicks, "d")
    const xAxis = d3.axisBottom().scale(xScale).ticks(xTicks, "d")

    const yAxis = d3
      .axisLeft()
      .scale(yScale)
      .tickFormat(function(d) {
        return yLabels[d]
      })

    chart.selectAll("*").remove()
    chart = chart
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${marginLeft}, ${MARGIN.top})`)

    chart.append("g").call(xAxisTop)

    chart.append("g").attr("transform", `translate(0, ${yHeight})`).call(xAxis)

    chart.append("g").call(yAxis)

    const bar = chart
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("g")
      .attr(
        "transform",
        (d, i) =>
          `translate(1, ${i * (BAR_HEIGHT + BAR_PADDING) + BAR_PADDING / 2})`
      )
      .classed("bar", true)
      .attr("id", function(d, i) {
        return `bar_${d.org.uuid}`
      })
    addD3Tooltip(bar, tooltip, !!onBarClick)
    if (onBarClick) {
      bar.on("click", (event, d) => onBarClick(d.org))
    }

    bar
      .append("rect")
      .attr("width", d => d.published && xScale(d.published))
      .attr("height", BAR_HEIGHT)
      .attr("fill", barColors.published)

    bar
      .append("text")
      .attr("x", d => xScale(d.published) - 6)
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d.published || "")
      .attr("fill", utils.getContrastYIQ(barColors.published))

    bar
      .append("rect")
      .attr("x", d => d.published && xScale(d.published))
      .attr("width", d => d.planned && xScale(d.planned))
      .attr("height", BAR_HEIGHT)
      .attr("fill", barColors.planned)

    bar
      .append("text")
      .attr("x", d => xScale(d.published + d.planned) - 6)
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d.planned || "")
      .attr("fill", utils.getContrastYIQ(barColors.planned))

    bar
      .append("rect")
      .attr(
        "x",
        d => (d.published || d.planned) && xScale(d.published + d.planned)
      )
      .attr("width", d => d.cancelled && xScale(d.cancelled))
      .attr("height", BAR_HEIGHT)
      .attr("fill", barColors.cancelled)

    bar
      .append("text")
      .attr("x", d => xScale(d.published + d.planned + d.cancelled) - 6)
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d.cancelled || "")
      .attr("fill", utils.getContrastYIQ(barColors.cancelled))
  }, [node, width, data, onBarClick, tooltip, barColors])

  return <svg id={chartId} ref={node} width={width} />
}

DailyRollupChart.defaultProps = {
  width: "100%"
}

export default DailyRollupChart
