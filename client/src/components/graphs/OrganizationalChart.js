import { gql } from "@apollo/client"
import API from "api"
import SVGCanvas from "components/graphs/SVGCanvas"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import * as d3 from "d3"
import { Symbol } from "milsymbol"

import { Organization, Position } from "models"
import PropTypes from "prop-types"
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback
} from "react"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import Settings from "settings"
import { flextree } from "d3-flextree"

const GQL_ORGANIZATION_FIELDS = /* GraphQL */ `
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
`

const GQL_GET_CHART_DATA = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      ${GQL_ORGANIZATION_FIELDS}
      childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
      }
      parentOrg {
        ${GQL_ORGANIZATION_FIELDS}
      }
      descendantOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        ${GQL_ORGANIZATION_FIELDS}
        childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
          uuid
        }
        parentOrg {
          uuid
        }
      }
    }
  }
`
const transitionDuration = 500

const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = [...positions].sort((p1, p2) =>
    ranks.indexOf(p1.person?.rank) > ranks.indexOf(p2.person?.rank) ? -1 : 1
  )
  return truncateLimit !== undefined && truncateLimit < allResults.length
    ? allResults.slice(0, truncateLimit)
    : allResults
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle,
  width,
  height: initialHeight
}) => {
  const history = useHistory()
  const canvasRef = useRef(null)
  const svgRef = useRef(null)
  const linkRef = useRef(null)
  const nodeRef = useRef(null)
  const treeLayout = useRef(null)
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

  const getDescendant = useCallback(
    uuid =>
      uuid && data?.organization?.descendantOrgs.find(org => org.uuid === uuid),
    [data]
  )
  const isParent = useCallback(
    node => node?.uuid === data?.organization?.parentOrg?.uuid,
    [data]
  )
  const isMain = useCallback(node => node?.uuid === data?.organization?.uuid, [
    data
  ])

  const getScale = useCallback(
    node => {
      if (isParent(node)) {
        return 0.7
      } else {
        let scale = 1.3
        let nodeIt = node
        while (nodeIt && !isMain(nodeIt)) {
          scale = scale / 1.4
          nodeIt = getDescendant(nodeIt.parentOrg?.uuid)
        }
        return scale
      }
    },
    [getDescendant, isParent, isMain]
  )

  const getSize = useCallback(
    node => {
      if (isMain(node)) {
        return [400, 400]
      } else if (isParent(node)) {
        return [200, 200]
      } else {
        return [200 * getScale(node), 200 * getScale(node)]
      }
    },
    [getScale, isMain, isParent]
  )

  useEffect(() => {
    if (data) {
      treeLayout.current = flextree()
        .children(d => {
          if (isParent(d)) {
            return [data.organization]
          }
          return data.organization.descendantOrgs.filter(
            org => org.parentOrg?.uuid === d.uuid
          )
        })
        .nodeSize(node => getSize(node.data))
        .spacing(10)
      const tree = treeLayout.current.hierarchy(
        data.organization.parentOrg || data.organization
      )
      treeLayout.current(tree)
      setRoot(tree)
      console.log(tree)
      console.log(treeLayout)
    }
  }, [data, isParent, getSize, isMain])

  useEffect(() => {
    if (!data || !root) {
      return
    }

    canvas.attr("transform", `translate(${width / 2},50)`)

    setHeight(1000)
  }, [canvas, data, height, width, root])

  useLayoutEffect(() => {
    if (!(link && node && data?.organization && treeLayout.current && root)) {
      return
    }

    const linkSelect = link
      .selectAll("path")
      .data(treeLayout.current(root).links())

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

    const nodeSelect = node
      .selectAll("g.org")
      .data(root.descendants(), d => d.data.uuid)

    nodeSelect
      .transition()
      .duration(transitionDuration)
      .attr(
        "transform",
        d =>
          `translate(${d.x},${d.y}) scale(${getScale(d.data)} ${getScale(
            d.data
          )})`
      )

    nodeSelect.exit().remove()

    const nodeEnter = nodeSelect
      .enter()
      .append("g")
      .attr("class", "org")
      .attr(
        "transform",
        d =>
          `translate(${d.x},${d.y}) scale(${getScale(d.data)} ${getScale(
            d.data
          )})`
      )

    nodeEnter
      .append("rect")
      .attr("rx", 7)
      .attr("ry", 7)
      .attr("x", d => -getSize(d.data)[0] / 2)
      .attr("y", 15)
      .attr("width", d => getSize(d.data)[0])
      .attr("height", d => getSize(d.data)[1] - 100 * getScale(d.data))
      // .attr("width", d => d.size[0]})
      // .attr("height", d => d.size[1] - 20)
      .style("fill", d =>
        isMain(d.data) ? "rgba(255, 255, 255, 1)" : "rgba(230, 230, 230, 0.5)"
      )
      .style("stroke", d => (isMain(d.data) ? "black" : "none"))

    nodeSelect
      .selectAll("rect")
      .attr("x", d => -getSize(d.data)[0] / 2)
      .attr("y", 15)
      .attr("width", d => getSize(d.data)[0])
      .attr("height", d => getSize(d.data)[1] - 100 * getScale(d.data))
      // .attr("width", d => d.size[0]})
      // .attr("height", d => d.size[1] - 20)
      .style("fill", d =>
        isMain(d.data) ? "rgba(255, 255, 255, 1)" : "rgba(230, 230, 230, 0.5)"
      )
      .style("stroke", d => (isMain(d.data) ? "black" : "none"))

    const iconNodeG = nodeEnter
      .append("g")
      .attr("class", "orgDetails")
      .attr("transform", "translate(-8,-15)")

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

    const headG = nodeEnter.selectAll("g.head").data(
      d => sortPositions(d.data.positions, 1) || [],
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
      .attr("href", d => d.person && (d.person.avatar || DEFAULT_AVATAR))

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

    const positionsG = nodeEnter.selectAll("g.position").data(
      d => sortPositions(d.data.positions, 10).slice(1),
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
      .attr("href", d => d.person && (d.person.avatar || DEFAULT_AVATAR))

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
  }, [data, history, root, link, node, isMain, getSize])

  return (
    <>
      {done && result}
      <SVGCanvas
        ref={svgRef}
        width={width}
        height={height}
        exportTitle={
          exportTitle || `${data.organization.shortName} organization chart`
        }
      >
        <g ref={canvasRef}>
          <g ref={linkRef} style={{ fill: "none", stroke: "#555" }} />
          <g
            ref={nodeRef}
            style={{ cursor: "pointer", pointerEvents: "all" }}
          />
        </g>
      </SVGCanvas>
    </>
  )
}

OrganizationalChart.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  org: PropTypes.object.isRequired,
  exportTitle: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
}

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
