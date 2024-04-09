import { gql } from "@apollo/client"
import API from "api"
import SVGCanvas from "components/graphs/SVGCanvas"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import * as d3 from "d3"
import _xor from "lodash/xor"
import ms from "milsymbol"
import { Organization, Position } from "models"
import { PositionRole } from "models/Position"
import PropTypes from "prop-types"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import DEFAULT_AVATAR from "resources/default_avatar.svg?inline"
import COLLAPSE_ICON from "resources/organizations.png?inline"
import EXPAND_ICON from "resources/plus.png?inline"
import Settings from "settings"
import utils from "utils"

const GQL_GET_CHART_DATA = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      positions {
        name
        uuid
        role
        organization {
          uuid
        }
        person {
          uuid
          name
          rank
          user
          avatarUuid
        }
      }
      ascendantOrgs {
        positions {
          person {
            user
          }
        }
      }
      childrenOrgs(query: { status: ACTIVE }) {
        uuid
      }
      descendantOrgs(query: { status: ACTIVE }) {
        uuid
        shortName
        longName
        identificationCode
        ascendantOrgs {
          positions {
            person {
              user
            }
          }
        }
        childrenOrgs(query: { status: ACTIVE }) {
          uuid
        }
        parentOrg {
          uuid
        }
        positions {
          name
          uuid
          role
          organization {
            uuid
          }
          person {
            uuid
            name
            rank
            user
            avatarUuid
          }
        }
      }
    }
  }
`
const transitionDuration = 200

const roles = Object.keys(PositionRole)
const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = positions?.sort(
    (p1, p2) =>
      // highest position role first
      roles.indexOf(p2.role) - roles.indexOf(p1.role) ||
      // when these are equal, highest ranking person first
      ranks.indexOf(p2.person?.rank) - ranks.indexOf(p1.person?.rank) ||
      // when these are also equal, sort alphabetically on person name
      p1.person?.name?.localeCompare(p2.person?.name) ||
      // else sort by position name
      p1.name?.localeCompare(p2.name) ||
      // last resort: sort by position uuid
      p1.uuid.localeCompare(p2.uuid)
  )

  return allResults.slice(0, truncateLimit)
}

const determineUnitCode = positions =>
  Settings.fields.person.ranks.find(
    element => element.value === positions?.[0]?.person?.rank
  )?.app6Modifier || "00"

const determineAffiliation = org => {
  let affiliation = "1"
  for (const ascendantOrg of org?.ascendantOrgs?.reverse()) {
    for (const position of ascendantOrg?.positions) {
      const person = position?.person
      if (person) {
        if (person.user) {
          // has at least one user, return early
          return "3"
        }
        // has at least one filled position
        affiliation = "4"
      }
    }
  }
  return affiliation
}

const determineSymbol = org => {
  const sortedPositions = sortPositions(org?.positions)
  const unitCode = determineUnitCode(sortedPositions)
  const affiliation = determineAffiliation(org)
  return new ms.Symbol(`100${affiliation}1000${unitCode}`, {
    size: 22
  })
}

// TODO: enable once innerhtml in svg is polyfilled
// const EXPAND_ICON = renderBlueprintIconAsSvg(IconNames.DIAGRAM_TREE)
// const COLLAPSE_ICON = renderBlueprintIconAsSvg(IconNames.CROSS)

const isLeader = position => position.role === PositionRole.LEADER.toString()

const getRoleValue = (position, leaderValue, nonLeaderValue) =>
  isLeader(position) ? leaderValue : nonLeaderValue

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle,
  width,
  height: initialHeight
}) => {
  const [expanded, setExpanded] = useState([])
  const [personnelDepth, setPersonnelDepth] = useState(5)
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const linkRef = useRef(null)
  const nodeRef = useRef(null)
  const tree = useRef(d3.tree())
  const [root, setRoot] = useState(null)
  const [height, setHeight] = useState(initialHeight)
  const { loading, error, data } = API.useApiQuery(GQL_GET_CHART_DATA, {
    uuid: org.uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const canvas = d3.select(canvasRef.current)
  const link = d3.select(linkRef.current)
  const node = d3.select(nodeRef.current)
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled

  useEffect(() => {
    data &&
      setRoot(
        d3.hierarchy(data.organization, d =>
          expanded.includes(d.uuid)
            ? data.organization.descendantOrgs.filter(
              org => org.parentOrg?.uuid === d.uuid
            )
            : null
        )
      )
  }, [data, expanded])

  useEffect(() => {
    if (!data || !root) {
      return
    }
    const nodeSize = [250, 80 + 26 * personnelDepth]

    const calculateBounds = rootArg => {
      const boundingBox = rootArg.descendants(root).reduce(
        (box, nodeArg) => ({
          xmin: Math.min(box.xmin, nodeArg.x ?? 0),
          xmax: Math.max(box.xmax, nodeArg.x ?? 0),
          ymin: Math.min(box.ymin, nodeArg.y ?? 0),
          ymax: Math.max(box.ymax, nodeArg.y ?? 0)
        }),
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
          boundingBox.xmax - boundingBox.xmin + nodeSize[0],
          boundingBox.ymax - boundingBox.ymin + nodeSize[1]
        ],
        center: [
          (boundingBox.xmax + boundingBox.xmin + nodeSize[0] - 200) / 2,
          (boundingBox.ymax + boundingBox.ymin + nodeSize[1] - 50) / 2
        ]
      }
    }

    tree.current.nodeSize(nodeSize)
    const bounds = calculateBounds(root)
    const scale = Math.min(
      1.2,
      1 / Math.max(bounds.size[0] / width, bounds.size[1] / height)
    )
    canvas.attr(
      "transform",
      `translate(${width / 2 - scale * bounds.center[0]},${
        height / 2 - scale * bounds.center[1]
      }) scale(${scale})`
    )

    setHeight(scale * bounds.size[1] + 50)
  }, [personnelDepth, canvas, data, height, width, root])

  useEffect(() => {
    data && setExpanded([data.organization.uuid])
  }, [data])

  useLayoutEffect(() => {
    if (!(link && node && data?.organization && tree.current && root)) {
      return
    }

    const linkSelect = link.selectAll("path").data(tree.current(root).links())

    linkSelect.attr(
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

    const nodeSelect = node
      .selectAll("g.org")
      .data(root.descendants(), d => d.data.uuid)

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
      .on("click", (event, d) =>
        setExpanded(expanded => _xor(expanded, [d.data.uuid]))
      )

    node
      .selectAll("image.orgChildIcon")
      .attr("href", d =>
        expanded.includes(d.data.uuid) ? COLLAPSE_ICON : EXPAND_ICON
      )

    iconNodeG
      .append("g")
      .on("click", (event, d) => navigate(Organization.pathFor(d.data)))
      .each(function(d) {
        return this.appendChild(determineSymbol(d.data).asDOM())
      })

    iconNodeG
      .append("text")
      .on("click", (event, d) => navigate(Organization.pathFor(d.data)))
      .attr("font-size", "20px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .attr("dy", 22)
      .attr("x", 38)
      .text(d => utils.ellipsize(d.data.shortName, 12))

    iconNodeG
      .append("text")
      .on("click", (event, d) => navigate(Organization.pathFor(d.data)))
      .attr("font-family", "monospace")
      .attr("dy", 45)
      .attr("x", -40)
      .text(d => utils.ellipsize(d.data.longName, 21))

    // Highlight all leaders
    const headG = nodeSelect.selectAll("g.head").data(
      d => sortPositions(d.data.positions, personnelDepth),
      d => d.uuid
    )

    const headGenter = headG
      .enter()
      .append("g")
      .attr("class", "head")
      .attr("transform", (d, i) => `translate(-63, ${50 + i * 26})`)
      .on("click", (event, d) => navigate(Position.pathFor(d)))

    headG.exit().remove()

    headGenter
      .append("image")
      .attr("width", d => getRoleValue(d, 26, 13))
      .attr("height", d => getRoleValue(d, 26, 13))
      .attr("y", d => getRoleValue(d, -15, -10))
      .attr("href", d =>
        attachmentsEnabled && d?.person?.avatarUuid
          ? `/api/attachment/view/${d.person.avatarUuid}`
          : DEFAULT_AVATAR
      )

    headGenter
      .append("text")
      .attr("x", d => getRoleValue(d, 26, 18))
      .attr("y", -4)
      .attr("font-size", d => getRoleValue(d, "11px", "9px"))
      .attr("font-family", "monospace")
      .attr("font-weight", d => getRoleValue(d, "bold", ""))
      .style("text-anchor", "start")
      .text(d => {
        const result = `${d.person ? d.person.rank : ""} ${
          d.person ? d.person.name : "unfilled"
        }`
        return utils.ellipsize(result, getRoleValue(d, 23, 31))
      })

    headGenter
      .append("text")
      .attr("x", d => getRoleValue(d, 26, 18))
      .attr("y", 6)
      .attr("font-size", d => getRoleValue(d, "11px", "9px"))
      .attr("font-family", "monospace")
      .attr("font-weight", d => getRoleValue(d, "bold", ""))
      .style("text-anchor", "start")
      .text(d => utils.ellipsize(d.name, getRoleValue(d, 23, 31)))
  }, [
    attachmentsEnabled,
    data,
    expanded,
    navigate,
    personnelDepth,
    root,
    link,
    node
  ])

  if (done) {
    return result
  }

  return (
    <SVGCanvas
      width={width}
      height={height}
      style={{ backgroundColor: "white" }}
      exportTitle={exportTitle}
      zoomFn={increment =>
        setPersonnelDepth(Math.max(0, personnelDepth + increment))}
    >
      <g ref={canvasRef}>
        <g ref={linkRef} style={{ fill: "none", stroke: "#555" }} />
        <g ref={nodeRef} style={{ cursor: "pointer", pointerEvents: "all" }} />
      </g>
    </SVGCanvas>
  )
}

OrganizationalChart.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  org: PropTypes.object.isRequired,
  exportTitle: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
}

OrganizationalChart.defaultProps = {
  width: 100,
  height: 100
}

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
