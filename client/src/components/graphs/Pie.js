import React, { useRef, useEffect } from "react"
import PropTypes from "prop-types"
import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"

const Pie = ({ label, segmentFill, segmentLabel, data, width, height }) => {
  const canvasRef = useRef(null)
  const pie = useRef(d3.pie())

  useEffect(() => {
    pie.current.value(function(d) {
      return d.value
    })
  }, [])

  useEffect(() => {
    const canvas = d3.select(canvasRef.current)
    const radius = Math.min(width, height) / 2 - 2
    const arcs = pie.current(d3.entries(data))
    const arcForLabels = d3
      .arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7)
    const selected = canvas.selectAll("path").data(arcs, d => d)

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
      .attr("fill", segmentFill)
      .attr("stroke", "grey")
      .style("stroke-width", "1px")

    selected.exit().remove()

    const labels = canvas
      .selectAll("text")
      .data(arcs, d => d)
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arcForLabels.centroid(d)})`)
      .attr("x", "-0.3em")
      .attr("y", "0.35em")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(segmentLabel)

    labels.exit().remove()

    canvas.select("text").text(label)
  }, [width, height, data, segmentFill, segmentLabel, label])

  return (
    <SVGCanvas width={width} height={height}>
      <g transform={`translate(${width / 2}, ${height / 2} )`} ref={canvasRef}>
        <text
          y="6px"
          style={{ textAnchor: "middle", fontWeight: "bold", fontSize: "17px" }}
        />
      </g>
    </SVGCanvas>
  )
}

Pie.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  segmentFill: PropTypes.func.isRequired,
  segmentLabel: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
}

export default Pie
