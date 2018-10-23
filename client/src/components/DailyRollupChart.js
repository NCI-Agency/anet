import PropTypes from 'prop-types'
import React, { Component } from 'react'

import './BarChart.css'

let d3 = require('d3')

class DailyRollupChart extends Component {

  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chartId: PropTypes.string,
    data: PropTypes.array,
    onBarClick: PropTypes.func,
    showPopover: PropTypes.func,
    hidePopover: PropTypes.func,
    barColors: PropTypes.shape({
      cancelled: PropTypes.string.isRequired,
      verified: PropTypes.string.isRequired,
    }).isRequired,
    updateChart: PropTypes.bool
  }

  static defaultProps = {
    width: '100%',
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

  isNumeric(value) {
    return typeof value === 'number'
  }

  createBarChart() {
    const BAR_HEIGHT = 24
    const BAR_PADDING = 8
    const MARGIN = {
      top: 30, right: 20,
      left: 20, bottom: 20,  // left and bottom MARGINs are dynamic, these are extra margins
    }
    let { width, onBarClick, barColors } = this.props
    let chartBox = this.node.getBoundingClientRect()
    let chartWidth = this.isNumeric(width) ? width : (chartBox.right - chartBox.left)
    let chartData = this.props.data
    let chart = d3.select(this.node)
    let xLabels = [].concat.apply(
      [],
      chartData.map(d => d.released + d.cancelled)
    )
    let yLabels = {}
    let yDomain = chartData.map(d => {
      yLabels[d.org.uuid] = d.org.shortName
      return d.org.uuid
    })

    // Calculate the maximum width of the axis labels
    let maxXLabelWidth = 0
    let maxYLabelWidth = 0
    let tmpSVG = d3.select('#tmp_svg').data([1]).enter().append('svg')
    let xLabelWidth = function() {
      if (this.getBBox().width > maxXLabelWidth) maxXLabelWidth = this.getBBox().width
    }
    let yLabelWidth = function(d) {
      if (this.getBBox().width > maxYLabelWidth) maxYLabelWidth = this.getBBox().width
    }
    tmpSVG.selectAll('.get_max_width_x_label')
      .data(xLabels)
      .enter().append('text')
      .text(d => d)
      .each(xLabelWidth)
      .remove()
    tmpSVG.selectAll('.get_max_width_y_label')
      .data(Object.values(yLabels))
      .enter().append('text')
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
    let yHeight = (BAR_HEIGHT + BAR_PADDING) * chartData.length + BAR_HEIGHT
    let chartHeight = yHeight + MARGIN.top + marginBottom

    let xMax = d3.max(xLabels)
    let xScale = d3.scaleLinear()
      .domain([0, xMax])
      .range([0, xWidth])

    let yScale = d3.scaleBand()
      .domain(yDomain)
      .range([0, yHeight])

    let xTicks = Math.min(xMax, 10)
    let xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(xTicks, 'd')
    let xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(xTicks, 'd')

    let yAxis = d3.axisLeft()
      .scale(yScale)
      .tickFormat(function(d) {
        return yLabels[d]
      })

    chart.selectAll('*').remove()
    chart = chart
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', `translate(${marginLeft}, ${MARGIN.top})`)

    chart.append('g')
      .call(xAxisTop)

    chart.append('g')
      .attr('transform', `translate(0, ${yHeight})`)
      .call(xAxis)

    chart.append('g')
      .call(yAxis)

    let bar = chart.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(2, ${i * (BAR_HEIGHT + BAR_PADDING) - 1})`)
      .classed('bar', true)
      .on('mouseenter', d => this.props.showPopover && this.props.showPopover(d3.event.target, d))
      .on('mouseleave', d => this.props.hidePopover && this.props.hidePopover())
    if (onBarClick) {
      bar.on('click', function(d) {
        onBarClick(d.org)
      })
    }

    bar.append('rect')
      .attr('width', d => d.released && xScale(d.released) - 2)
      .attr('height', BAR_HEIGHT)
      .attr('fill', barColors.verified)

    bar.append('text')
      .attr('x', d => xScale(d.released) - 6)
      .attr('y', BAR_HEIGHT / 2)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text(d => d.released || '')

    bar.append('rect')
      .attr('x', d => d.released && xScale(d.released) - 2)
      .attr('width', d => d.cancelled && (xScale(d.cancelled) - (d.released ? 0 : 2)))
      .attr('height', BAR_HEIGHT)
      .attr('fill', barColors.cancelled)

    bar.append('text')
      .attr('x', d => xScale(d.released) + xScale(d.cancelled) - 6)
      .attr('y', BAR_HEIGHT / 2)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text(d => d.cancelled || '')
  }

  render() {
    return <svg id={this.props.chartId} ref={node => this.node = node} width={this.props.width} height={this.props.height}></svg>
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps && !nextProps.updateChart
        && nextProps.width === this.props.width
        && nextProps.height === this.props.height) {
      return false
    }
    return true
  }

}

export default DailyRollupChart
