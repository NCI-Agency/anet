import * as d3 from "d3"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import "./BarChart.css"

const DailyRollupChart = props => {
  const {
    width,
    height,
    chartId,
    data,
    onBarClick,
    showPopover,
    hidePopover,
    barColors
  } = props
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
    let chartBox = node.current.getBoundingClientRect()
    let chartWidth = isNumeric(width)
      ? width - 30
      : chartBox.right - chartBox.left - 30
    let chart = d3.select(node.current)
    let xLabels = [].concat.apply([], data.map(d => d.published + d.cancelled))
    let yLabels = {}
    let yDomain = data.map(d => {
      yLabels[d.org.uuid] = d.org.shortName
      return d.org.uuid
    })

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    let tmpSVG = d3
      .select("#tmp_svg")
      .data([1])
      .enter()
      .append("svg")
    let xLabelWidth = function() {
      if (this.getBBox().width > maxXLabelWidth) {
        maxXLabelWidth = this.getBBox().width
      }
    }
    let yLabelWidth = function(d) {
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
    let marginLeft = maxYLabelWidth + MARGIN.left
    // The bottom margin depends on the width of the x-axis labels.
    let marginBottom = maxXLabelWidth + MARGIN.bottom
    let xWidth = chartWidth - marginLeft - MARGIN.right

    // We use a dynamic yHeight, depending on how much data we have to display,
    // in order to make sure the chart is readable for lots of data
    let yHeight = (BAR_HEIGHT + BAR_PADDING) * data.length
    let chartHeight = yHeight + MARGIN.top + marginBottom

    let xMax = d3.max(xLabels)
    let xScale = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, xWidth])

    let yScale = d3
      .scaleBand()
      .domain(yDomain)
      .range([0, yHeight])

    let xTicks = Math.min(xMax, 10)
    let xAxisTop = d3
      .axisTop()
      .scale(xScale)
      .ticks(xTicks, "d")
    let xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(xTicks, "d")

    let yAxis = d3
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

    let bar = chart
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
      .on("mouseenter", d => showPopover && showPopover(d3.event.target, d))
      .on("mouseleave", d => hidePopover && hidePopover())
    if (onBarClick) {
      bar.on("click", function(d) {
        onBarClick(d.org)
      })
    }

    bar
      .append("rect")
      .attr("width", d => d.published && xScale(d.published))
      .attr("height", BAR_HEIGHT)
      .attr("fill", barColors.verified)

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
  }, [
    node,
    width,
    height,
    data,
    onBarClick,
    showPopover,
    hidePopover,
    barColors
  ])

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
  showPopover: PropTypes.func,
  hidePopover: PropTypes.func,
  barColors: PropTypes.shape({
    cancelled: PropTypes.string.isRequired,
    verified: PropTypes.string.isRequired
  }).isRequired
}

DailyRollupChart.defaultProps = {
  width: "100%"
}

export default DailyRollupChart
