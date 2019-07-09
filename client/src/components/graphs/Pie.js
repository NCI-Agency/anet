import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"
import PropTypes from "prop-types"

export default class Pie extends SVGCanvas {
  static propTypes = {
    label: PropTypes.string.isRequired,
    segmentFill: PropTypes.func.isRequired,
    segmentLabel: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired
  }

  componentDidMount() {
    this.canvas = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.props.size.width / 2}, ${this.props.size.height / 2})`
      )
    this.pie = d3.pie()
    this.pie.value(function(d) {
      return d.value
    })

    this.canvas
      .append("text")
      .attr("y", "6px")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "17px")

    this.update()
  }

  componentDidUpdate() {
    this.update()
  }

  update() {
    const radius =
      Math.min(this.props.size.width, this.props.size.height) / 2 - 2
    const arcs = this.pie(d3.entries(this.props.data))
    const arcForLabels = d3
      .arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7)
    const selected = this.canvas.selectAll("path").data(arcs, d => d)

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
      .attr("fill", this.props.segmentFill)
      .attr("stroke", "grey")
      .style("stroke-width", "1px")

    selected.exit().remove()

    const labels = this.canvas
      .selectAll("text")
      .data(arcs, d => d)
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arcForLabels.centroid(d)})`)
      .attr("x", "-0.3em")
      .attr("y", "0.35em")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(this.props.segmentLabel)

    labels.exit().remove()

    this.canvas.select("text").text(this.props.label)
  }
}
