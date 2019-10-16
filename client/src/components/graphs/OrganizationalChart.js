import API, { Settings } from "api"
import { gql } from "apollo-boost"
import SVGCanvas from "components/graphs/SVGCanvas"
import { useBoilerplate } from "components/Page"
import * as d3 from "d3"
import _xor from "lodash/xor"
import { Symbol } from "milsymbol"
import { Organization, Position } from "models"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useHistory } from "react-router-dom"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import EXPAND_ICON from "resources/plus.png"

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
const transitionDuration = 200

const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = [...positions].sort((p1, p2) =>
    ranks.indexOf(p1.person?.rank) > ranks.indexOf(p2.person?.rank) ? -1 : 1
  )
  return truncateLimit !== undefined && truncateLimit < allResults.length
    ? allResults.slice(0, truncateLimit)
    : allResults
}

const OrganizationalChart = props => {
  const [expanded, setExpanded] = useState([])
  const [personnelDepth, setPersonnelDepth] = useState(5)
  const history = useHistory()
  const svgContainer = useRef(null)
  const canvas = useRef(null)
  const link = useRef(null)
  const node = useRef(null)
  const getNodeSize = useCallback(() => [200, 100 + 11 * personnelDepth])
  const calculateBounds = useCallback(root => {
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
        boundingBox.xmax - boundingBox.xmin + getNodeSize()[0] + 100,
        boundingBox.ymax - boundingBox.ymin + getNodeSize()[1]
      ],
      center: [
        (boundingBox.xmax + boundingBox.xmin + getNodeSize()[0] - 50) / 2,
        (boundingBox.ymax + boundingBox.ymin + getNodeSize()[1] - 50) / 2
      ]
    }
  })

  const { loading, error, data } = API.useApiQuery(GQL_GET_CHART_DATA, {
    uuid: props.org.uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })

  useEffect(() => {
    if (!data) {
      // TODO: make effect only happen on svgContainer.current change
      return
    }
    canvas.current = d3.select(svgContainer.current).append("g")
    link.current = canvas.current
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
    node.current = canvas.current
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all")
  }, [data])

  useEffect(() => {
    if (!data) {
      return
    }
    setExpanded([data.organization.uuid])
  }, [data])

  useEffect(() => {
    if (!svgContainer.current || !data?.organization) {
      return
    }

    const chartBox = svgContainer.current.getBoundingClientRect()
    const fullWidth = chartBox.width
    const fullHeight = chartBox.height

    canvas.current.attr(
      "transform",
      "translate(" + fullHeight / 2 + "," + 50 + ")"
    )

    const tree = d3.tree().size(fullWidth, fullHeight)

    tree.nodeSize(getNodeSize())

    const root = d3.hierarchy(data.organization, d =>
      expanded.includes(d.uuid)
        ? data.organization.descendantOrgs.filter(org =>
          d.childrenOrgs.map(org => org.uuid).includes(org.uuid)
        )
        : []
    )

    const linkSelect = link.current.selectAll("path").data(tree(root).links())

    linkSelect
      .transition()
      .duration(transitionDuration)
      .attr(
        "d",
        d3
          .linkVertical()
          .x(d => d.x)
          .y(d => d.y)
      )

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

    const nodeSelect = node.current.selectAll("g.org").data(root.descendants(), d => d.data.uuid)

    nodeSelect
      .transition()
      .duration(transitionDuration)
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
      .attr("class", "orgChildIcon")
      .attr("width", 12)
      .attr("height", 12)
      .attr("x", -15)
      .attr("y", 5)
      .on("click", d => setExpanded(expanded => _xor(expanded, [d.data.uuid])))

    node.current
      .selectAll("image.orgChildIcon")
      .attr("href", d =>
        expanded.indexOf(d.data.uuid) > -1 ? ORGANIZATIONS_ICON : EXPAND_ICON
      )

    iconNodeG
      .append("g")
      .on("click", d => history.push(Organization.pathFor(d.data)))
      .each(function(d) {
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
      .append("text")
      .on("click", d => history.push(Organization.pathFor(d.data)))
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
      .append("text")
      .on("click", d => history.push(Organization.pathFor(d.data)))
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
        d => sortPositions(d.data.positions, Math.min(1, personnelDepth)) || [],
        d => d.uuid
      )

    const headGenter = headG
      .enter()
      .append("g")
      .attr("class", "head")
      .attr("transform", "translate(-63, 65)")
      .on("click", d => history.push(Position.pathFor(d)))

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
        d => sortPositions(d.data.positions, personnelDepth).slice(1),
        d => d.uuid
      )

    positionsG.exit().remove()

    const positionsGA = positionsG
      .enter()
      .append("g")
      .attr("class", "position")
      .attr("transform", (d, i) => `translate(-63,${87 + i * 11})`)
      .on("click", d => history.push(Position.pathFor(d)))

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

    const bounds = calculateBounds(root)

    const scale = Math.min(
      1.2,
      1 / Math.max(bounds.size[0] / fullWidth, bounds.size[1] / fullHeight)
    )

    canvas.current.attr(
      "transform",
      `translate(${fullWidth / 2 - scale * bounds.center[0]},${fullHeight / 2 -
        scale * bounds.center[1]}) scale(${scale})`
    )
    d3.select(svgContainer.current).attr("height", scale * bounds.size[1] + 50)
  }, [
    calculateBounds,
    data,
    expanded,
    getNodeSize,
    history,
    personnelDepth,
    svgContainer
  ])

  if (done) {
    return result
  }

  return (
    <SVGCanvas
      size={props.size}
      exportTitle={`${data.shortName} organization chart`}
      ref={svgContainer}
      zoomFn={increment =>
        setPersonnelDepth(Math.max(0, personnelDepth + increment))}
    />
  )
}

OrganizationalChart.propTypes = {
  org: PropTypes.object.isRequired,
  size: PropTypes.object.isRequired
}

export default OrganizationalChart
