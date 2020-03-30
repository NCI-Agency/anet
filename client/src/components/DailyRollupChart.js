import * as d3 from "d3"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import ReactTooltip from "react-tooltip"
import "./BarChart.css"

const DailyRollupChart = ({
  width,
  height,
  chartId,
  data,
  onBarClick,
  tooltip,
  barColors
}) => {
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
    const chartWidth = (isNumeric(width) ? width : chartBox.width) - 30
    let chart = d3.select(node.current)
    const xLabels = [].concat.apply(
      [],
      data.map(d => d.published + d.cancelled)
    )
    const yLabels = {}
    const yDomain = data.map(d => {
      yLabels[d.org.uuid] = d.org.shortName
      return d.org.uuid
    })

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    const tmpSVG = d3
      .select("#tmp_svg")
      .data([1])
      .enter()
      .append("svg")
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
    const xScale = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, xWidth])

    const yScale = d3
      .scaleBand()
      .domain(yDomain)
      .range([0, yHeight])

    const xTicks = Math.min(xMax, 10)
    const xAxisTop = d3
      .axisTop()
      .scale(xScale)
      .ticks(xTicks, "d")
    const xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(xTicks, "d")

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

    chart
      .append("g")
      .attr("transform", `translate(0, ${yHeight})`)
      .call(xAxis)

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
      .attr("data-for", "tooltip-top")
      .attr("data-html", true)
      .attr("data-tip", d => tooltip && tooltip(d))
    if (onBarClick) {
      bar.on("click", function(d) {
        onBarClick(d.org)
      })
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

    bar
      .append("rect")
      .attr("x", d => d.published && xScale(d.published))
      .attr("width", d => d.cancelled && xScale(d.cancelled))
      .attr("height", BAR_HEIGHT)
      .attr("fill", barColors.cancelled)

    bar
      .append("text")
      .attr("x", d => xScale(d.published) + xScale(d.cancelled) - 6)
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d.cancelled || "")

    ReactTooltip.rebuild()
  }, [node, width, height, data, onBarClick, tooltip, barColors])

  return <svg id={chartId} ref={node} width={width} height={height} />

  function isNumeric(value) {
    return typeof value === "number"
  }
}

DailyRollupChart.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  chartId: PropTypes.string,
  data: PropTypes.array,
  onBarClick: PropTypes.func,
  tooltip: PropTypes.func,
  barColors: PropTypes.shape({
    cancelled: PropTypes.string.isRequired,
    published: PropTypes.string.isRequired
  }).isRequired
}

DailyRollupChart.defaultProps = {
  width: "100%"
}

export default DailyRollupChart
