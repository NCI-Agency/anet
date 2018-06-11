import PropTypes from 'prop-types'
import React, { Component } from 'react'

import './BarChart.css'

let d3 = require('d3')

/*
 * A bar chart component displaying horizontal bars, grouped per category
 */
class HorizontalBarChart extends Component {
  /*
   * Example for the data property structure when displaying number of
   * engagements per location, grouped by day:
   * [{
      key: '25 Oct 2017',
        values: [{
          key: 'Location 1',
          value: 11
        }, {
          key: 'Location 2',
          value: 8
        }]
      }, {
        key: '27 Oct 2017',
          values: [{
          key: '',
          value: 0
        }]
      }, {
        key: '28 Oct 2017',
        values: [{
          key: 'Location 4',
          value: 3
        }]
      }]
  */
  static propTypes = {
    chartId: PropTypes.string,
    data: PropTypes.object,
    onBarClick: PropTypes.func,
    updateChart: PropTypes.bool
  }

  static defaultProps = {
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
    const BAR_PADDING = 8
    const MARGIN = {top: 20, right: 20}  // left and bottom MARGINs are dynamic
    let box = this.node.getBoundingClientRect()
    let chartWidth = box.right - box.left
    let chartData = this.props.data.data
    let categoryLabels = this.props.data.categoryLabels
    let leavesLabels = this.props.data.leavesLabels
    let onBarClick = this.props.onBarClick
    let chart = d3.select(this.node)
    let xLabels = [].concat.apply(
      [],
      chartData.map(
        function(d, i) {
          return d.values.map(d => d.value)
        })
    )
    let yLabels = Object.values(categoryLabels)

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
      .data(yLabels)
      .enter().append('text')
      .attr('class', 'y-axis')
      .text(d => d)
      .each(yLabelWidth)
      .remove()
    tmpSVG.remove()

    // The left margin depends on the width of the y-axis labels.
    // We add extra margin to make sure that if the label is different because
    // of the automatic formatting the labels are still displayed on the chart.
    let marginLeft = maxYLabelWidth + 50
    // The bottom margin depends on the width of the x-axis labels.
    let marginBottom = maxXLabelWidth + 20
    let xWidth = chartWidth - marginLeft - MARGIN.right

    let categoryDomain = []
    let cummulative = 0
    chartData.forEach(function(val, i) {
      // per category, how many elements, including the elements of the previous categories
      val.cummulative = cummulative
      cummulative += val.values.length
      val.values.forEach(function(values) {
        values.parentKey = val.key
        categoryDomain.push(i)
      })
    })

    // We use a dynamic yHeight, depending on how much data we have to display,
    // in order to make sure the chart is readable for lots of data 
    let yHeight = (BAR_HEIGHT + BAR_PADDING) * categoryDomain.length + BAR_HEIGHT
    let chartHeight = yHeight + MARGIN.top + marginBottom

    let yCategoryScale = d3.scaleLinear()
      .range([yHeight, 0])
    let yScale = d3.scaleBand()
      .domain(categoryDomain)
      .rangeRound([yHeight, 0])
      .padding(0.1)
    let yCategoryDomain = yScale.bandwidth() * categoryDomain.length
    yCategoryScale.domain([yCategoryDomain, 0])

    let xScale = d3.scaleLinear()
      .range([0, xWidth])
      .domain([0, d3.max(xLabels)])

    let xAxis = d3.axisBottom()
      .scale(xScale)

    let yAxis = d3.axisLeft()
      .scale(yCategoryScale)

    chart.selectAll('*').remove()
    chart = chart
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', 'translate(' + marginLeft + ',' + MARGIN.top + ')')

    chart.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + yHeight + ')')
      .call(xAxis)

    chart.append('g')
      .attr('class', 'y axis')
      .call(yAxis)

    let categoryGroup = chart.selectAll('.category')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', function(d, i) {
        return 'category-' + (i % 2)
      })
      .attr('transform', function(d) {
        return 'translate(1,' + yCategoryScale((d.cummulative * yScale.bandwidth())) + ')'
      })

    categoryGroup.selectAll('.category-label')
      .data(function(d) { return [d] })
      .enter()
      .append('text')
      .attr('class', 'category-label')
      .attr('transform', function(d) {
        let x = -2
        let y = yCategoryScale((d.values.length * yScale.bandwidth() +
          BAR_PADDING) / 2)
        return 'translate(' + x + ',' + y + ')'
      })
      .text(d => categoryLabels[d.key])
      .attr('text-anchor', 'end')

    let barsGroup = categoryGroup.selectAll('.category-bars-group')
      .data(d => d.values)
      .enter()
      .append('g')
      .attr('class', 'category-bars-group')
      .attr('transform', function(d, i) {
        return 'translate(0,' + yCategoryScale((i * yScale.bandwidth())) + ')'
      })

    barsGroup.selectAll('.bar')
      .data(function(d) {
        return [d]
      })
      .enter()
      .filter(d => d.value !== undefined)
      .append('rect')
      .attr('class', 'bar')
      .attr('id', function(d, i) { return 'bar_' + d.key + d.parentKey })
      .attr('x', 0)
      .attr('y', yCategoryScale(BAR_PADDING))
      .attr('width', d => xScale(d.value))
      .attr('height', yCategoryScale(yScale.bandwidth() - BAR_PADDING))

    barsGroup.selectAll('.bar-label')
      .data(function(d) { return [d] })
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('transform', function(d) {
        let x = 3
        let y = yCategoryScale((yScale.bandwidth() + BAR_PADDING) / 2)
        return 'translate(' + x + ',' + y + ')'
      })
      .text(d => leavesLabels[d.key])
      .attr('text-anchor', 'start')

    this.bindElementOnClick(barsGroup, onBarClick)
  }

  bindElementOnClick(element, onClickHandler) {
    if (onClickHandler) {
      element.on('click', function(d) {
        onClickHandler(d)
      })
    }
  }

  render() {
    return <svg id={this.props.chartId} ref={node => this.node = node} width='100%'></svg>
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

export default HorizontalBarChart