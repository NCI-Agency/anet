import API, { Settings } from "api"
import { gql } from "apollo-boost"
import SVGCanvas from "components/graphs/SVGCanvas"
import * as d3 from "d3"
import { Symbol } from "milsymbol"
import { Organization } from "models"
import PropTypes from "prop-types"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import ORGANIZATIONS_ICON from "resources/organizations.png"

const GQL_GET_CHART_DATA = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      type
      positions {
        name
        uuid
        person {
          rank
          name
          uuid
          avatar(size: 32)
        }
      }
      childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
      }
      descendantOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
        shortName
        longName
        type
        childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
          uuid
        }
        positions {
          name
          uuid
          person {
            rank
            name
            uuid
            avatar(size: 32)
          }
        }
      }
    }
  }
`

const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = [...positions].sort((p1, p2) =>
    ranks.indexOf(p1.person?.rank) > ranks.indexOf(p2.person?.rank) ? -1 : 1
  )
  return truncateLimit !== undefined && truncateLimit < allResults.length
    ? allResults.slice(0, truncateLimit)
    : allResults
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
      collapsed: [],
      personnelDepth: 5
    }

    this.tree = d3.tree()
  }

  zoomFn(modifier) {
    this.setState({
      personnelDepth: Math.max(0, this.state.personnelDepth + modifier)
    })
  }

  getNodeSize() {
    return [200, 100 + 11 * this.state.personnelDepth]
  }

  componentDidMount() {
    this.canvas = this.svg.append("g")

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

    tree.nodeSize(this.getNodeSize())

    const root = d3.hierarchy(this.state.root, d =>
      this.state.collapsed.includes(d.uuid)
        ? []
        : this.state.orgs.filter(org =>
          d.childrenOrgs.map(org => org.uuid).includes(org.uuid)
        )
    )

    const linkSelect = this.link.selectAll("path").data(tree(root).links())

    linkSelect
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

    linkSelect.exit().remove()

    linkSelect.attr(
      "d",
      d3
        .linkVertical()
        .x(d => d.x)
        .y(d => d.y)
    )

    const nodeSelect = this.node
      .selectAll("g.org")
      .data(root.descendants())
      .attr("transform", d => `translate(${d.x},${d.y})`)

    const nodeEnter = nodeSelect
      .enter()
      .append("g")
      .attr("class", "org")
      .attr("transform", d => `translate(${d.x},${d.y})`)

    nodeSelect.exit().remove()

    const iconNodeG = nodeEnter
      .append("g")
      .attr("class", "orgDetails")
      .attr("transform", "translate(-8,-15)")

    iconNodeG
      .filter(d => d.data.childrenOrgs.length > 0)
      .append("image")
      .attr("width", 12)
      .attr("height", 12)
      .attr("x", -15)
      .attr("y", 5)
      .attr("href", ORGANIZATIONS_ICON)
      .on("click", d => {
        const index = this.state.collapsed.indexOf(d.data.uuid)
        let newCollapsed = this.state.collapsed.slice()
        if (index > -1) {
          newCollapsed.splice(index, 1)
        } else {
          newCollapsed.push(d.data.uuid)
        }
        this.setState({
          collapsed: newCollapsed
        })
      })

    iconNodeG.each(function(d) {
      const positions = sortPositions(d.data.positions)
      const unitcode = Settings.fields.person.ranks.find(
        element => element.value === positions?.[0]?.person?.rank
      )?.app6Modifier

      const sym = new Symbol(
        `S${
          d.data.type === Organization.TYPE.ADVISOR_ORG ? "F" : "N"
        }GPU------${unitcode || "-"}`,
        { size: 22 }
      )
      this.appendChild(sym.asDOM())
    })

    iconNodeG
      .append("a")
      .attr("href", d => `/organizations/${d.data.uuid}`)
      .append("text")
      .attr("font-size", "20px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .attr("dy", 22)
      .attr("x", 38)
      .text(d =>
        d.data.shortName?.length > 12
          ? d.data.shortName.substring(0, 10) + ".."
          : d.data.shortName
      )

    iconNodeG
      .append("a")
      .attr("href", d => `/organizations/${d.data.uuid}`)
      .append("text")
      .attr("font-family", "monospace")
      .attr("dy", 45)
      .attr("x", -40)
      .text(d =>
        d.data.longName?.length > 21
          ? d.data.longName.substring(0, 18) + ".."
          : d.data.longName
      )

    const headG = nodeSelect
      .selectAll("g.head")
      .data(
        d =>
          sortPositions(
            d.data.positions,
            Math.min(1, this.state.personnelDepth)
          ) || [],
        d => d.uuid
      )

    const headGenter = headG
      .enter()
      .append("g")
      .attr("class", "head")
      .attr("transform", "translate(-63, 65)")
      .append("a")
      .attr("href", d => `/positions/${d.uuid}`)

    headG.exit().remove()

    headGenter
      .append("image")
      .attr("width", 26)
      .attr("height", 26)
      .attr("y", -15)
      .attr(
        "href",
        d =>
          d.person &&
          (d.person.avatar
            ? "data:image/jpeg;base64," + d.person.avatar
            : DEFAULT_AVATAR)
      )

    headGenter
      .append("text")
      .attr("x", 26)
      .attr("y", -4)
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .style("text-anchor", "start")
      .text((position, i) => {
        const name = `${position.person ? position.person.rank : ""} ${
          position.person ? position.person.name : "unfilled"
        }`
        return name.length > 23 ? name.substring(0, 21) + ".." : name
      })

    headGenter
      .append("text")
      .attr("x", 26)
      .attr("y", 6)
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .style("text-anchor", "start")
      .text((position, i) =>
        position.name.length > 23
          ? position.name.substring(0, 21) + ".."
          : position.name
      )

    const positionsG = nodeSelect
      .selectAll("g.position")
      .data(
        d =>
          sortPositions(d.data.positions, this.state.personnelDepth).slice(1),
        d => d.uuid
      )

    positionsG.exit().remove()

    const positionsGA = positionsG
      .enter()
      .append("g")
      .attr("class", "position")
      .attr("transform", (d, i) => `translate(-63,${87 + i * 11})`)
      .append("a")
      .attr("href", d => `/positions/${d.uuid}`)

    positionsGA
      .append("image")
      .attr("width", 13)
      .attr("height", 13)
      .attr("y", -10)
      .attr(
        "href",
        d =>
          d.person &&
          (d.person.avatar
            ? "data:image/jpeg;base64," + d.person.avatar
            : DEFAULT_AVATAR)
      )

    positionsGA
      .append("text")
      .attr("x", 18)
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .style("text-anchor", "start")
      .text((d, i) => {
        const result = `${d.person ? d.person.rank : ""} ${
          d.person ? d.person.name : "unfilled"
        } ${d.name}`
        return result.length > 31 ? result.substring(0, 28) + "..." : result
      })

    const parent = this.svg.node()
    const fullWidth = parent.clientWidth
    const fullHeight = parent.clientHeight

    const bounds = this.calculateBounds(root)

    const scale = Math.min(
      1.2,
      1 / Math.max(bounds.size[0] / fullWidth, bounds.size[1] / fullHeight)
    )

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
        boundingBox.xmax - boundingBox.xmin + this.getNodeSize()[0] + 100,
        boundingBox.ymax - boundingBox.ymin + this.getNodeSize()[1]
      ],
      center: [
        (boundingBox.xmax + boundingBox.xmin + this.getNodeSize()[0] - 50) / 2,
        (boundingBox.ymax + boundingBox.ymin + this.getNodeSize()[1] - 50) / 2
      ]
    }
  }

  fetchData() {
    if (!this.props.org || !this.props.org.uuid) return

    API.query(GQL_GET_CHART_DATA, { uuid: this.props.org.uuid }).then(data =>
      this.setState({
        root: data.organization,
        orgs: data.organization.descendantOrgs,
        collapsed: data.organization.childrenOrgs.map(d => d.uuid)
      })
    )
  }
}
