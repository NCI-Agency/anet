import * as d3 from "d3"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import ReactTooltip from "react-tooltip"
import "./BarChart.css"

/*
 * A bar chart component displaying horizontal bars, grouped per category
 */
const HorizontalBarChart = props => {
  /*
   * Example for the data property structure when displaying number of
   * engagements per location, grouped by day:
   *
   *  props.data = {
   *    categoryLabels: {
   *      1540677600000: "28 Oct 2018",
   *      1540767600000: "29 Oct 2018",
   *      1540854000000: "30 Oct 2018",
   *    },
   *    leavesLabels: {
   *      -1: "No location allocated",
   *      a873c6dc-e0aa-47cd-b2b5-9e017f1293ac: "General Hospital",
   *      1ee8cf79-7b20-4045-b349-2d354e10d41f: "Fort Amherst",
   *      4d115293-0e8b-45ba-a632-a36136d5ed89: "MoD Headquarters Kabul"
   *    },
   *    data: [
   *      {
   *        key: 1540677600000,
   *        values: [{}]
   *      },
   *      {
   *        key: 1540767600000,
   *        values: [
   *          {
   *            key: "a873c6dc-e0aa-47cd-b2b5-9e017f1293ac",
   *            value: 2
   *          }
   *        ]
   *      },
   *      {
   *        key: 1540854000000,
   *        values: [
   *          {
   *            key: "-1",
   *            value: 1
   *          },
   *          {
   *            key: "a873c6dc-e0aa-47cd-b2b5-9e017f1293ac",
   *            value: 1
   *          },
   *          {
   *            key: "1ee8cf79-7b20-4045-b349-2d354e10d41f"
   *            value: 1
   *          },
   *          {
   *            key: "4d115293-0e8b-45ba-a632-a36136d5ed89",
   *            value: 1
   *          }
   *        ]
   *      }
   *    ]
   *  }
   */
  const {
    width,
    height,
    chartId,
    data,
    onBarClick,
    tooltip,
    selectedBarClass,
    selectedBar
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
      left: 0,
      bottom: 20 // left and bottom MARGINs are dynamic, these are extra margins
    }
    let chartBox = node.current.getBoundingClientRect()
    let chartWidth = isNumeric(width) ? width : chartBox.width
    let chartData = data.data
    let categoryLabels = data.categoryLabels
    let leavesLabels = data.leavesLabels
    let chart = d3.select(node.current)
    let xLabels = [].concat.apply(
      [],
      chartData.map(d => d.values.map(d => d.value))
    )
    let yLabels = Object.values(categoryLabels)

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
      .attr("class", "x axis")
      .text(d => d)
      .each(xLabelWidth)
      .remove()
    tmpSVG
      .selectAll(".get_max_width_y_label")
      .data(yLabels)
      .enter()
      .append("text")
      .attr("class", "category-label")
      .text(d => d)
      .each(yLabelWidth)
      .remove()
    tmpSVG.remove()

    // The left margin depends on the width of the y-axis labels.
    let marginLeft = maxYLabelWidth + MARGIN.left
    // The bottom margin depends on the width of the x-axis labels.
    let marginBottom = maxXLabelWidth + MARGIN.bottom
    let xWidth = chartWidth - marginLeft - MARGIN.right

    let categoryDomain = []
    let cumulative = 0
    chartData.forEach(function(val, i) {
      // per category, how many elements, including the elements of the previous categories
      val.cumulative = cumulative
      cumulative += val.values.length
      val.values.forEach(function(values) {
        values.parentKey = val.key
        categoryDomain.push(i)
      })
    })

    // We use a dynamic yHeight, depending on how much data we have to display,
    // in order to make sure the chart is readable for lots of data
    let yHeight = (BAR_HEIGHT + BAR_PADDING) * categoryDomain.length
    let chartHeight = yHeight + MARGIN.top + marginBottom

    let yCategoryScale = d3.scaleLinear().range([yHeight, 0])
    let yScale = d3
      .scaleBand()
      .domain(categoryDomain)
      .rangeRound([yHeight, 0])
      .padding(0.1)
    let yCategoryDomain = yScale.bandwidth() * categoryDomain.length
    yCategoryScale.domain([yCategoryDomain, 0])

    let xMax = d3.max(xLabels)
    let xScale = d3
      .scaleLinear()
      .range([0, xWidth])
      .domain([0, xMax])

    let xTicks = Math.min(xMax, 10)
    let xAxisTop = d3
      .axisTop()
      .scale(xScale)
      .ticks(xTicks, "d")
    let xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(xTicks, "d")

    let yAxis = d3.axisLeft().scale(yCategoryScale)

    chart.selectAll("*").remove()
    chart = chart
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${marginLeft}, ${MARGIN.top})`)

    chart
      .append("g")
      .attr("class", "x axis")
      .call(xAxisTop)

    chart
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${yHeight})`)
      .call(xAxis)

    chart
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)

    let categoryGroup = chart
      .selectAll(".category")
      .data(chartData)
      .enter()
      .append("g")
      .attr("class", function(d, i) {
        return `category-${i % 2}`
      })
      .attr("transform", function(d) {
        return `translate(1, ${yCategoryScale(
          d.cumulative * yScale.bandwidth()
        )})`
      })

    categoryGroup
      .selectAll(".category-label")
      .data(function(d) {
        return [d]
      })
      .enter()
      .append("text")
      .attr("class", "category-label")
      .attr("transform", function(d) {
        let x = -2
        let y = yCategoryScale(
          (d.values.length * yScale.bandwidth()) / 2 + BAR_PADDING
        )
        return `translate(${x}, ${y})`
      })
      .text(d => categoryLabels[d.key])
      .attr("text-anchor", "end")

    let barsGroup = categoryGroup
      .selectAll(".category-bars-group")
      .data(d => d.values)
      .enter()
      .append("g")
      .attr("class", "category-bars-group")
      .attr("transform", function(d, i) {
        return `translate(0, ${yCategoryScale(i * yScale.bandwidth())})`
      })

    barsGroup
      .selectAll(".bar")
      .data(function(d) {
        return [d]
      })
      .enter()
      .filter(d => d.value !== undefined)
      .append("rect")
      .attr("class", "bar")
      .attr("id", function(d, i) {
        return `bar_${d.key}${d.parentKey}`
      })
      .classed(selectedBarClass, function(d, i) {
        return this.id === selectedBar
      })
      .attr("x", 0)
      .attr("y", yCategoryScale(BAR_PADDING))
      .attr("width", d => xScale(d.value))
      .attr("height", BAR_HEIGHT)
      .attr("data-for", "tooltip-top")
      .attr("data-html", true)
      .attr("data-tip", d => tooltip && tooltip(d))

    barsGroup
      .selectAll(".bar-label")
      .data(function(d) {
        return [d]
      })
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("transform", function(d) {
        let x = 3
        let y = yCategoryScale(yScale.bandwidth() / 2 + BAR_PADDING)
        return `translate(${x}, ${y})`
      })
      .text(d => leavesLabels[d.key])
      .attr("text-anchor", "start")

    bindElementOnClick(barsGroup, onBarClick)

    ReactTooltip.rebuild()
  }, [
    node,
    width,
    height,
    chartId,
    data,
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

  function isNumeric(value) {
    return typeof value === "number"
  }

  function bindElementOnClick(element, onClickHandler) {
    if (onClickHandler) {
      element.on("click", function(d) {
        onClickHandler(d)
      })
    }
  }
}

HorizontalBarChart.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  chartId: PropTypes.string,
  data: PropTypes.object,
  onBarClick: PropTypes.func,
  tooltip: PropTypes.func,
  selectedBarClass: PropTypes.string,
  selectedBar: PropTypes.string
}

HorizontalBarChart.defaultProps = {
  width: "100%",
  selectedBarClass: "selected-bar",
  selectedBar: "",
  updateChart: true
}

export default HorizontalBarChart
