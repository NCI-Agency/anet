import * as d3 from "d3"
import PropTypes from "prop-types"
import React, { Component } from "react"
import "./BarChart.css"

/*
 * Given an object and a property of the type prop1.prop2.prop3,
 * return obj[prop1][prop2][prop3]
 */
function getPropValue(obj, prop) {
  var getterDetails = [obj]
  var objProps = prop.split(".")
  for (var i = 0; i < objProps.length; i++) {
    getterDetails.push(objProps[i])
  }
  return getterDetails.reduce(function(d, v) {
    return d[v]
  })
}

class BarChart extends Component {
  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chartId: PropTypes.string,
    data: PropTypes.array,
    xProp: PropTypes.string.isRequired,
    yProp: PropTypes.string.isRequired,
    xLabel: PropTypes.string,
    barClass: PropTypes.string,
    onBarClick: PropTypes.func,
    showPopover: PropTypes.func,
    hidePopover: PropTypes.func,
    selectedBarClass: PropTypes.string,
    selectedBar: PropTypes.string,
    updateChart: PropTypes.bool
  }

  static defaultProps = {
    width: "100%",
    barClass: "bars-group",
    selectedBarClass: "selected-bar",
    selectedBar: "",
    updateChart: true
  }

  node = React.createRef()

  constructor(props) {
    super(props)
    this.createBarChart = this.createBarChart.bind(this)
  }

  componentDidMount() {
    this.createBarChart()
  }

  componentDidUpdate() {
    this.createBarChart()
  }

  isNumeric(value) {
    return typeof value === "number"
  }

  createBarChart() {
    const MARGIN = {
      top: 20,
      right: 20,
      left: 40,
      bottom: 0 // left and bottom MARGINs are dynamic, these are extra margins
    }
    let chartData = this.props.data
    let xProp = this.props.xProp // data property to use for the x-axis domain
    let yProp = this.props.yProp // data property to use for the y-axis domain
    let xLabel = this.props.xLabel || this.props.xProp // data property to use for the x-axis ticks label
    var xLabels = {} // dict containing x-value and corresponding tick label
    let onBarClick = this.props.onBarClick

    let xScale = d3.scaleBand().domain(
      chartData.map(function(d) {
        xLabels[getPropValue(d, xProp)] = getPropValue(d, xLabel)
        return getPropValue(d, xProp)
      })
    )
    let yMax = d3.max(chartData, function(d) {
      return getPropValue(d, yProp)
    })
    let yScale = d3.scaleLinear().domain([0, yMax])

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    let tmpSVG = d3
      .select("#tmp_svg")
      .data([1])
      .enter()
      .append("svg")
    let xText = function(d) {
      return xLabels[getPropValue(d, xProp)]
    }
    let yText = function(d) {
      return getPropValue(d, yProp)
    }
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
    for (let i = 0; i < chartData.length; i++) {
      tmpSVG
        .selectAll(".get_max_width_x_label")
        .data(chartData)
        .enter()
        .append("text")
        .text(xText)
        .each(xLabelWidth)
        .remove()
      tmpSVG
        .selectAll(".get_max_width_y_label")
        .data(chartData)
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
    let marginLeft = maxYLabelWidth + MARGIN.left
    // The bottom margin depends on the width of the x-axis labels.
    let marginBottom = maxXLabelWidth + MARGIN.bottom

    let chart = d3.select(this.node.current)
    let chartBox = this.node.current.getBoundingClientRect()
    let chartWidth = this.isNumeric(this.props.width)
      ? this.props.width
      : chartBox.right - chartBox.left
    let chartHeight = this.isNumeric(this.props.height)
      ? this.props.height
      : 0.7 * chartWidth
    let xWidth = chartWidth - marginLeft - MARGIN.right
    let yHeight = chartHeight - MARGIN.top - marginBottom

    xScale.rangeRound([0, xWidth]).padding(0.1)
    yScale.range([yHeight, 0])

    let xAxis = d3.axisBottom(xScale).tickFormat(function(d) {
      return xLabels[d]
    })

    let yTicks = Math.min(yMax, 10)
    let yAxis = d3.axisLeft(yScale).ticks(yTicks, "d")

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

    const selectedBar = this.props.selectedBar
    let bar = chart
      .selectAll(`.${this.props.barClass}`)
      .data(chartData)
      .enter()
      .append("g")
      .classed(this.props.barClass, true)
      .append("rect")
      .attr("id", function(d, i) {
        return `bar_${getPropValue(d, xProp)}`
      })
      .classed(this.props.selectedBarClass, function(d, i) {
        return this.id === selectedBar
      })
      .attr("x", function(d) {
        return xScale(getPropValue(d, xProp))
      })
      .attr("y", function(d) {
        return yScale(getPropValue(d, yProp))
      })
      .attr("width", xScale.bandwidth())
      .attr("height", function(d) {
        return yHeight - yScale(getPropValue(d, yProp))
      })
      .on(
        "mouseenter",
        d =>
          this.props.showPopover && this.props.showPopover(d3.event.target, d)
      )
      .on("mouseleave", d => this.props.hidePopover && this.props.hidePopover())
    if (onBarClick) {
      bar.on("click", function(d) {
        onBarClick(d)
      })
    }
  }

  render() {
    return (
      <svg
        id={this.props.chartId}
        ref={this.node}
        width={this.props.width}
        height={this.props.height}
      />
    )
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Make sure the chart is only re-rendered if the state or properties have
    // changed. This because we do not want to re-render the chart only in order
    // to highlight a bar in the chart.
    if (
      nextProps &&
      !nextProps.updateChart &&
      nextProps.width === this.props.width &&
      nextProps.height === this.props.height
    ) {
      return false
    }
    return true
  }
}

export default BarChart
