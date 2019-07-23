import API, { Settings } from "api"
import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"
import PropTypes from "prop-types"
import { Symbol, getColorMode } from "milsymbol"
import Organization from "../../models/Organization"

const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = [...positions].sort((p1, p2) =>
    ranks.indexOf(p1.person && p1.person.rank) <
    ranks.indexOf(p2.person && p2.person.rank)
      ? 1
      : -1
  )
  return truncateLimit && truncateLimit < allResults.length
    ? allResults.slice(0, truncateLimit)
    : allResults
}

const rankToUnit = {
  "OF-9": "K",
  "OF-8": "J",
  "OF-7": "I",
  "OF-6": "H",
  "OF-5": "G",
  "OF-4": "F",
  "OF-3": "E",
  "OF-2": "E",
  "OF-1": "E"
}

export default class OrganizationalChart extends SVGCanvas {
  static propTypes = {
    org: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      root: null,
      orgs: [],
      nodeSize: [250, 150]
    }

    this.tree = d3.tree()
  }

  componentDidMount() {
    this.canvas = this.svg.append("g")

    this.zoom = d3.zoom().on("zoom", () => {
      return this.canvas.attr("transform", d3.event.transform)
    })

    this.svg.call(this.zoom)

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
      "translate(" + this.props.height / 2 + "," + 50 + ")"
    )

    if (!this.state.root) return

    const tree = d3.tree().size(this.props.width, this.props.height)

    tree.nodeSize(this.state.nodeSize)

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
      .attr("stroke-opacity", " 0.3")
      .attr(
        "d",
        d3
          .linkVertical()
          .x(d => d.x)
          .y(d => d.y)
      )

    const node = this.node
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)

    const iconNodeG = node.append("g").attr("transform", "translate(-25,-25)")

    iconNodeG.each(function(d) {
      const positions = sortPositions(d.data.positions)
      const unitcode =
        rankToUnit[
          positions.length > 0 &&
            positions[0].person &&
            positions[0].person.rank
        ]
      const sym = new Symbol(
        `S${
          d.data.type === Organization.TYPE.ADVISOR_ORG ? "F" : "N"
        }GPU------${unitcode || "-"}`,
        { size: 32 }
      )
      this.appendChild(sym.asDOM())
    })

    iconNodeG
      .append("a")
      .attr("href", d => `/organizations/${d.data.uuid}`)
      .append("text")
      .attr("font-family", "monospace")
      .attr("dy", -3)
      .attr("x", 8)
      .style("text-anchor", "start")
      .text(d => {
        const result = `${d.data.shortName}${d.data.longName ? " - " : ""}${
          d.data.longName
        }`
        return result.length > 26 ? result.substring(0, 23) + "..." : result
      })

    const positionsG = node.append("g")
    positionsG
      .selectAll("a")
      .data(d => sortPositions(d.data.positions, 10) || [])
      .enter()
      .append("a")
      .attr("href", d => `/positions/${d.uuid}`)
      .append("text")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("dy", (d, i) => 5 + i * 11)
      .attr("x", 28)
      .style("text-anchor", "start")
      .text(d => {
        const result = `${d.person ? d.person.rank : ""} ${
          d.person ? d.person.name : "unfilled"
        }@${d.name}`
        return result.length > 45 ? result.substring(0, 42) + "..." : result
      })

    const parent = this.svg.node()
    const fullWidth = parent.clientWidth
    const fullHeight = parent.clientHeight

    const bounds = this.calculateBounds(root)

    const scale =
      1 / Math.max(bounds.size[0] / fullWidth, bounds.size[1] / fullHeight)
    const translate = [
      fullWidth / 2 - scale * bounds.center[0],
      fullHeight / 2 - scale * bounds.center[1]
    ]

    this.canvas.attr(
      "transform",
      `translate(${fullWidth / 2 - scale * bounds.center[0]},${fullHeight / 2 -
        scale * bounds.center[1]}) scale(${scale})`
    )
    this.svg.attr("height", scale * bounds.size[1] + 50)
  }

  calculateBounds(root) {
    const boundingBox = root.descendants().reduce(
      (box, node) => {
        return {
          xmin: Math.min(box.xmin, node.x),
          xmax: Math.max(box.xmax, node.x),
          ymin: Math.min(box.ymin, node.y),
          ymax: Math.max(box.ymax, node.y)
        }
      },
      {
        xmin: Number.MAX_SAFE_INTEGER,
        xmax: Number.MIN_SAFE_INTEGER,
        ymin: Number.MAX_SAFE_INTEGER,
        ymax: Number.MIN_SAFE_INTEGER
      }
    )
    return {
      box: boundingBox,
      size: [
        boundingBox.xmax - boundingBox.xmin + this.state.nodeSize[0]*1.5,
        boundingBox.ymax - boundingBox.ymin + this.state.nodeSize[1]
      ],
      center: [(boundingBox.xmax + boundingBox.xmin + this.state.nodeSize[0]) / 2, (boundingBox.ymax + boundingBox.ymin) / 2]
    }
  }

  fetchData() {
    if (!this.props.org || !this.props.org.uuid) return

    const chartQuery = API.query(
      /* GraphQL */
      `organization(uuid: "${this.props.org.uuid}") {
            uuid
            shortName
            longName
            type
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
              type
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
