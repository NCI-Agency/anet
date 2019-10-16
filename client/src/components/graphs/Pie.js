import React, { useRef, useEffect } from "react"
import PropTypes from "prop-types"
import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"

const Pie = props => {
  const svgContainer = useRef(null)
  const canvas = useRef(null)
  const pie = useRef(d3.pie())

  useEffect(() => {
    canvas.current = d3
      .select(svgContainer.current)
      .append("g")
      .attr(
        "transform",
        `translate(${props.size.width / 2}, ${props.size.height / 2})`
      )
    pie.current.value(function(d) {
      return d.value
    })

    canvas.current
      .append("text")
      .attr("y", "6px")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "17px")
  }, [props.size.height, props.size.width, svgContainer])

  useEffect(() => {
    const radius = Math.min(props.size.width, props.size.height) / 2 - 2
    const arcs = pie.current(d3.entries(props.data))
    const arcForLabels = d3
      .arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7)
    const selected = canvas.current.selectAll("path").data(arcs, d => d)

    selected
      .enter()
      .append("path")
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(radius / 2)
          .outerRadius(radius)
      )
      .attr("fill", props.segmentFill)
      .attr("stroke", "grey")
      .style("stroke-width", "1px")

    selected.exit().remove()

    const labels = canvas.current
      .selectAll("text")
      .data(arcs, d => d)
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arcForLabels.centroid(d)})`)
      .attr("x", "-0.3em")
      .attr("y", "0.35em")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(props.segmentLabel)

    labels.exit().remove()

    canvas.current.select("text").text(props.label)
  }, [props])

  return <SVGCanvas size={props.size} ref={svgContainer} />
}

Pie.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  segmentFill: PropTypes.func.isRequired,
  segmentLabel: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  size: PropTypes.object.isRequired
}

export default Pie
