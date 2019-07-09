import API from "api"
import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"
import PropTypes from "prop-types"

export default class OrganizationalChart extends SVGCanvas {
  static propTypes = {
    org: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      root: null,
      orgs: []
    }

    this.tree = d3.tree()
  }

  componentDidMount() {
    this.canvas = this.svg.append("g")

    this.svg.call(
      d3
        .zoom()
        .on("zoom", () => this.canvas.attr("transform", d3.event.transform))
    )

    this.link = this.canvas
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")

    this.node = this.canvas
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all")

    this.update()
  }

  componentDidUpdate(prevProps, prevState) {
    this.update(prevProps, prevState)
  }

  update(prevProps, prevState) {
    if (!prevProps || prevProps.org.valueOf() !== this.props.org.valueOf()) {
      this.fetchData()
    }

    this.canvas.attr(
      "transform",
      "translate(" + this.props.height / 2 + "," + 20 + ")"
    )

    if (!this.state.root) return

    const tree = d3.tree().size(this.props.width, this.props.height)

    tree.nodeSize([250, 150])

    const root = d3.hierarchy(this.state.root, d =>
      this.state.orgs.filter(org =>
        d.childrenOrgs.map(org => org.uuid).includes(org.uuid)
      )
    )

    this.link
      .selectAll(".path")
      .data(tree(root).links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke-opacity"," 0.3")
      .attr(
        "d",
        d3
          .linkVertical()
          .x(d => d.x)
          .y(d => d.y)
      )

    const node = this.link
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr(
        "class",
        d => `node ${d.children ? "node--internal" : "node--leaf"}`
      )
      .attr("transform", d => `translate(${d.x},${d.y})`)

    node.append("circle").attr("r", 2.5)

    node
      .append("a")
      .attr("href", d => `/organizations/${d.data.uuid}`)
      .append("text")
      .attr("font-family","monospace")
      .attr("dy", 3)
      .attr("x", 8)
      .style("text-anchor", "start")
      .text(d => {
        const result = `${d.data.shortName} (${d.data.longName})`
        return result.length > 26 ? result.substring(0, 23) + "..." : result })

    const ggg = node.append("g")
    ggg
      .selectAll("a")
      .data(d => d.data.positions || [])
      .enter()
      .append("a")
      .attr("href", d => `/positions/${d.uuid}`)
      .append("text")
      .attr("font-size", "9px")
      .attr("font-family","monospace")
      .attr("dy", (d, i) => 20 + i * 11)
      .attr("x", 8)
      .style("text-anchor", "start")
      .text(
        d => {
          const result = `${d.person ? d.person.rank : ""} ${
            d.person ? d.person.name : "unfilled"
          }@${d.name}`
          return result.length > 45 ? result.substring(0, 42) + "..." : result })

  }

  fetchData() {
    if (!this.props.org || !this.props.org.uuid) return

    const chartQuery = API.query(
      /* GraphQL */
      `organization(uuid: "${this.props.org.uuid}") {
            uuid
            shortName
            longName
            positions{
                name
                uuid
                person
                {
                  rank
                  name
                  uuid
                }
              }
            childrenOrgs(query: {pageNum: 0, pageSize: 0}) {
              uuid
            }
            descendantOrgs(query: {pageNum: 0, pageSize: 0}) {
              uuid
              shortName
              longName
              childrenOrgs(query: {pageNum: 0, pageSize: 0}) {
                uuid
              }
              positions{
                name
                uuid
                person
                {
                  rank
                  name
                  uuid
                }
              }
        
            }
          }`
    )

    Promise.all([chartQuery]).then(values =>
      this.setState({
        root: values[0].organization,
        orgs: values[0].organization.descendantOrgs
      })
    )
  }
}
