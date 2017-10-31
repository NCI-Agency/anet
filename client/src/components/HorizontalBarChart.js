import React, { Component, PropTypes } from 'react'

var d3 = require('d3')


/*
 * Given an object and a property of the type prop1.prop2.prop3,
 * return obj[prop1][prop2][prop3]
 */
function getPropValue(obj, prop) {
  var getterDetails = [obj]
  var objProps = prop.split('.')
  for (var i = 0; i < objProps.length; i++) {
    getterDetails.push(objProps[i])
  }
  return getterDetails.reduce(function(d, v) {
    return d[v]
  })
}

export default class HorizontalBarChart extends Component {
  static propTypes = {
    chartId: PropTypes.string,
    data: PropTypes.array,
    xProp: PropTypes.string.isRequired,
    yProp: PropTypes.string.isRequired,
    yLabel: PropTypes.string,
    barColor: PropTypes.string,
    onBarClick: PropTypes.func,
    updateChart: PropTypes.bool
  }

  static defaultProps = {
    barColor: '#F5CA8D',
    updateChart: true
  }

  constructor(props){
    super(props)
    this.createBarChart = this.createBarChart.bind(this)
  }

  componentDidMount() {
    this.createBarChart()
  }

  componentDidUpdate() {
    this.createBarChart()
  }

  createBarChart() {
    const BAR_HEIGHT = 24
//    const BAR_PADDING = 8
    const MARGIN = {top: 20, right: 20}  // left and bottom margins are dynamic
    let chartData = this.props.data
    let xProp = this.props.xProp  // data property to use for the x-axis domain
    let yProp = this.props.yProp  // data property to use for the y-axis domain
    let yLabel = this.props.yLabel || this.props.xProp  // data property to use for the x-axis ticks label
    var yLabels = {}  // dict containing y-value and corresponding tick label
    let onBarClick = this.props.onBarClick

    let xScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, function(d) { return getPropValue(d, xProp) })])
    let yScale = d3.scaleBand()
      .domain(chartData.map(function(d) { yLabels[getPropValue(d, yProp)] = getPropValue(d, yLabel); return getPropValue(d, yProp) }))

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    let tmpSVG = d3.select("#tmp_svg").data([1]).enter().append('svg')
    let xText = function(d) { return yLabels[getPropValue(d, xProp)] }
    let yText = function(d) { return getPropValue(d, yProp) }
    let xLabelWidth = function() {
      if (this.getBBox().width > maxXLabelWidth) maxXLabelWidth = this.getBBox().width
    }
    let yLabelWidth = function(d) {
      if (this.getBBox().width > maxYLabelWidth) maxYLabelWidth = this.getBBox().width
    }
    for (let i = 0; i < chartData.length; i++) {
      tmpSVG.selectAll('.get_max_width_x_label')
        .data(chartData)
        .enter().append('text')
        .text(xText)
        .each(xLabelWidth)
        .remove()
      tmpSVG.selectAll('.get_max_width_y_label')
        .data(chartData)
        .enter().append('text')
        .attr('class', 'y-axis')
        .text(yText)
        .each(yLabelWidth)
        .remove()
    }
    tmpSVG.remove()

    // The left margin depends on the width of the y-axis labels.
    // We add extra margin to make sure that if the label is different because
    // of the automatic formatting the labels are still displayed on the chart.
    let marginLeft = maxYLabelWidth + 50
    // The bottom margin depends on the width of the x-axis labels.
    let marginBottom = maxXLabelWidth

    let chart = d3.select(this.node)
    let box = this.node.getBoundingClientRect()
    let chartWidth = box.right - box.left
    let xWidth = chartWidth - marginLeft - MARGIN.right
    // We use a dynamic yHeight, depending on how much data we have to display,
    // in order to make sure the chart is readable for lots of data 
    //let yHeight = (BAR_HEIGHT + BAR_PADDING) * chartData.length - BAR_PADDING
    let yHeight = BAR_HEIGHT * chartData.length
    let chartHeight = yHeight + MARGIN.top + marginBottom

    xScale.range([0, xWidth])
    yScale.rangeRound([yHeight, 0])
      .padding(0.1)

    let xAxis = d3.axisBottom(xScale)
    let yAxis = d3.axisLeft(yScale)
      .tickFormat(function(d) { return yLabels[d] })

    chart.selectAll('*').remove()
    chart = chart
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', `translate(${marginLeft}, ${MARGIN.top})`)

    chart.append('g')
      .attr('transform', `translate(0, ${yHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'start')

    chart.append('g')
      .call(yAxis)
    let barColor = this.props.barColor
    let bar = chart.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('g')
      .classed('bar', true)
      .append('rect')
      .attr('id', function(d, i) { return 'bar_' + getPropValue(d, xProp) })
      .attr('x', 1) // at 0 we have the y-axis
      .attr('y', function(d) { return yScale(getPropValue(d, yProp)) })
      .attr('width', function(d) { return xWidth - xScale(getPropValue(d, xProp)) })
      .attr('height', yScale.bandwidth())
      .attr('fill', barColor)
    if (onBarClick) {
      bar.on('click', function(d) {
        onBarClick(d)
      })
    }
  }

  render() {
    return <svg id={this.props.chartId} ref={node => this.node = node} width="100%"></svg>
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Make sure the chart is only re-rendered if the state or properties have
    // changed. This because we do not want to re-render the chart only in order
    // to highlight a bar in the chart.
    if (nextProps && !nextProps.updateChart) {
      return false
    }
    return true
  }

}
