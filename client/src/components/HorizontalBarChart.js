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
   *
   *  this.props.data = {
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

  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chartId: PropTypes.string,
    data: PropTypes.object,
    onBarClick: PropTypes.func,
    showPopover: PropTypes.func,
    hidePopover: PropTypes.func,
    selectedBarClass: PropTypes.string,
    selectedBar: PropTypes.string,
    updateChart: PropTypes.bool
  }

  static defaultProps = {
    width: '100%',
    selectedBarClass: 'selected-bar',
    selectedBar: '',
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
      left: 0, bottom: 20,  // left and bottom MARGINs are dynamic, these are extra margins
    }
    let chartBox = this.node.getBoundingClientRect()
    let chartWidth = this.isNumeric(this.props.width) ? this.props.width : (chartBox.right - chartBox.left)
    let chartData = this.props.data.data
    let categoryLabels = this.props.data.categoryLabels
    let leavesLabels = this.props.data.leavesLabels
    let onBarClick = this.props.onBarClick
    let chart = d3.select(this.node)
    let xLabels = [].concat.apply(
      [],
      chartData.map(d => d.values.map(d => d.value))
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
      .attr('class', 'x axis')
      .text(d => d)
      .each(xLabelWidth)
      .remove()
    tmpSVG.selectAll('.get_max_width_y_label')
      .data(yLabels)
      .enter().append('text')
      .attr('class', 'category-label')
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

    let yCategoryScale = d3.scaleLinear()
      .range([yHeight, 0])
    let yScale = d3.scaleBand()
      .domain(categoryDomain)
      .rangeRound([yHeight, 0])
      .padding(0.1)
    let yCategoryDomain = yScale.bandwidth() * categoryDomain.length
    yCategoryScale.domain([yCategoryDomain, 0])

    let xMax = d3.max(xLabels)
    let xScale = d3.scaleLinear()
      .range([0, xWidth])
      .domain([0, xMax])

    let xTicks = Math.min(xMax, 10)
    let xAxisTop = d3.axisTop()
      .scale(xScale)
      .ticks(xTicks, 'd')
    let xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(xTicks, 'd')

    let yAxis = d3.axisLeft()
      .scale(yCategoryScale)

    chart.selectAll('*').remove()
    chart = chart
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', `translate(${marginLeft}, ${MARGIN.top})`)

    chart.append('g')
      .attr('class', 'x axis')
      .call(xAxisTop)

    chart.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${yHeight})`)
      .call(xAxis)

    chart.append('g')
      .attr('class', 'y axis')
      .call(yAxis)

    let categoryGroup = chart.selectAll('.category')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', function(d, i) {
        return `category-${i % 2}`
      })
      .attr('transform', function(d) {
        return `translate(1, ${yCategoryScale(d.cumulative * yScale.bandwidth())})`
      })

    categoryGroup.selectAll('.category-label')
      .data(function(d) { return [d] })
      .enter()
      .append('text')
      .attr('class', 'category-label')
      .attr('transform', function(d) {
        let x = -2
        let y = yCategoryScale((d.values.length * yScale.bandwidth()) / 2 + BAR_PADDING)
        return `translate(${x}, ${y})`
      })
      .text(d => categoryLabels[d.key])
      .attr('text-anchor', 'end')

    let barsGroup = categoryGroup.selectAll('.category-bars-group')
      .data(d => d.values)
      .enter()
      .append('g')
      .attr('class', 'category-bars-group')
      .attr('transform', function(d, i) {
        return `translate(0, ${yCategoryScale(i * yScale.bandwidth())})`
      })

    const selectedBar = this.props.selectedBar
    barsGroup.selectAll('.bar')
      .data(function(d) {
        return [d]
      })
      .enter()
      .filter(d => d.value !== undefined)
      .append('rect')
      .attr('class', 'bar')
      .attr('id', function(d, i) { return `bar_${d.key}${d.parentKey}` })
      .classed(this.props.selectedBarClass, function(d, i) { return this.id === selectedBar })
      .attr('x', 0)
      .attr('y', yCategoryScale(BAR_PADDING))
      .attr('width', d => xScale(d.value))
      .attr('height', BAR_HEIGHT)
      .on('mouseenter', d => this.props.showPopover && this.props.showPopover(d3.event.target, d))
      .on('mouseleave', d => this.props.hidePopover && this.props.hidePopover())

    barsGroup.selectAll('.bar-label')
      .data(function(d) { return [d] })
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('transform', function(d) {
        let x = 3
        let y = yCategoryScale(yScale.bandwidth() / 2 + BAR_PADDING)
        return `translate(${x}, ${y})`
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
    return <svg id={this.props.chartId} ref={node => this.node = node} width={this.props.width} height={this.props.height}></svg>
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Make sure the chart is only re-rendered if the state or properties have
    // changed. This because we do not want to re-render the chart only in order
    // to highlight a bar in the chart.
    if (nextProps && !nextProps.updateChart
        && nextProps.width === this.props.width
        && nextProps.height === this.props.height) {
      return false
    }
    return true
  }

}

export default HorizontalBarChart
