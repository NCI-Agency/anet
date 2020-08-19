import { Tooltip } from "@blueprintjs/core"
import API from "api"
import { gql } from "apollo-boost"
import SVGCanvas from "components/graphs/SVGCanvas"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import * as d3 from "d3"
import { flextree } from "d3-flextree"
import { Symbol } from "milsymbol"
import { Organization, Position } from "models"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import Settings from "settings"
import utils from "utils"
import useD3Transition from "use-d3-transition"
import Text from "react-svg-text"

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
const ranks = Settings.fields.person.ranks.map(rank => rank.value)

const sortPositions = (positions, truncateLimit) => {
  const allResults = [...positions].sort((p1, p2) =>
    ranks.indexOf(p1.person?.rank) > ranks.indexOf(p2.person?.rank) ? -1 : 1
  )
  return truncateLimit !== undefined && truncateLimit < allResults.length
    ? allResults.slice(0, truncateLimit)
    : allResults
}

const PositionNode = ({ position, size }) => {
  const history = useHistory()

  return (
    <Tooltip
      key={position.uuid}
      popoverClassName="bp3-dark"
      content={
        <>
          <LinkTo modelType="Person" model={position.person} /> -{" "}
          <LinkTo modelType="Position" model={position} />{" "}
        </>
      }
      targetTagName="g"
      wrapperTagName="g"
    >
      <g onClick={() => history.push(Position.pathFor(position))}>
        <image
          width={13}
          height={13}
          y={-10}
          href={position.person?.avatar || DEFAULT_AVATAR}
        />
        <Text x={18} fontSize="9px" fontFamily="monospace" textAnchor="start">
          {utils.ellipsize(`${position.person ? position.person.rank : ""} ${
              position.person ? position.person.name : "unfilled"
            } ${position.name}`, size[0] * 0.16)}
        </Text>
      </g>
    </Tooltip>
  )
}

PositionNode.propTypes = {
  position: PropTypes.object.isRequired,
  size: PropTypes.arrayOf(PropTypes.number).isRequired
}

const OrganizationLink = ({ link }) => {
  const d = d3
    .linkVertical()
    .x(d => d.x)
    .y(d => d.y)(link)

  const { ref, attrState } = useD3Transition({
    attrsToTransitionTo: { d },
    deps: [link]
  })
  return <path ref={ref} strokeOpacity={0.4} d={attrState.d} />
}

OrganizationLink.propTypes = {
  link: PropTypes.object.isRequired
}

const OrganizationNode = ({ org, x, y, scale, size, symbol, isMain }) => {
  const history = useHistory()

  const transform = `translate(${x},${y}) scale(${scale} ${scale})`
  const background = isMain
    ? "rgba(255, 255, 255, 1)"
    : "rgba(230, 230, 230, 0.5)"

  const { ref, attrState } = useD3Transition({
    attrsToTransitionTo: { transform, background },
    deps: [x, y, isMain]
  })

  return (
    <g ref={ref} className="org" key={org.uuid} transform={attrState.transform}>
      <rect
        rx="15"
        ry="15"
        x={-size[0] / 2}
        y={-20}
        width={size[0]}
        height={size[1]}
        style={{
          fill: attrState.background,
          stroke: isMain ? "black" : "none"
        }}
      />
      <g className="orgDetails">
        <g transform="translate(-15,-15)">
          <g
            onClick={() => history.push(Organization.pathFor(org))}
            dangerouslySetInnerHTML={{ __html: symbol.asSVG() }}
          />
          <text
            onClick={() => history.push(Organization.pathFor(org))}
            fontSize="20px"
            fontFamily="monospace"
            fontWeight="bold"
            dy={22}
            x={38}
          >
            {org.shortName?.length > 12
              ? org.shortName.substring(0, 10) + ".."
              : org.shortName}
          </text>
          <text
            onClick={() => history.push(Organization.pathFor(org))}
            fontFamily="monospace"
            dy={45}
            x={-40}
          >
            {org.longName?.length > 21
              ? org.longName.substring(0, 18) + ".."
              : org.longName}
          </text>
        </g>
        <g transform={`translate(${5 + -size[0] / 2},60)`}>
          {sortPositions(org.positions).map((position, i) => (
            <g key={position.uuid} transform={`translate(0,${i * 11})`}>
              <PositionNode position={position} size={size} />
            </g>
          ))}
        </g>
      </g>
    </g>
  )
}

OrganizationNode.propTypes = {
  org: PropTypes.object.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  size: PropTypes.arrayOf(PropTypes.number).isRequired,
  symbol: PropTypes.object,
  isMain: PropTypes.bool
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle,
  width,
  height: initialHeight
}) => {
  const svgRef = useRef(null)
  const treeLayout = useRef(null)
  const [root, setRoot] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1.3)
  const [height, setHeight] = useState(initialHeight)
  const { loading, error, data } = API.useApiQuery(GQL_GET_CHART_DATA, {
    uuid: org.uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const getDescendant = useCallback(
    uuid =>
      uuid && data?.organization?.descendantOrgs.find(org => org.uuid === uuid),
    [data]
  )

  const distanceFromMain = useCallback(
    node => {
      if (node?.uuid === data?.organization?.parentOrg?.uuid) {
        return -1
      } else {
        let distance = 0
        let nodeIt = node
        while (nodeIt && nodeIt.uuid !== data?.organization?.uuid) {
          distance++
          nodeIt = getDescendant(nodeIt.parentOrg?.uuid)
        }
        return distance
      }
    },
    [data, getDescendant]
  )

  const getScale = useCallback(
    node =>
      (distanceFromMain(node) === 0 ? 1.3 : zoomLevel) *
      Math.pow(0.7, Math.abs(distanceFromMain(node))),
    [distanceFromMain, zoomLevel]
  )

  const getSize = useCallback(
    (node, scale = 1) => {
      if (distanceFromMain(node) === 0) {
        return [400 * scale, (node.positions?.length * 11 + 100) * scale]
      } else {
        return [200 * scale, (node.positions?.length * 11 + 100) * scale]
      }
    },
    [distanceFromMain]
  )

  useEffect(() => {
    if (data) {
      treeLayout.current = flextree()
        .children(d => {
          if (distanceFromMain(d) === -1) {
            return [data.organization]
          }
          return data.organization.descendantOrgs.filter(
            org => org.parentOrg?.uuid === d.uuid
          )
        })
        .nodeSize(node => getSize(node.data, getScale(node.data)))
        .spacing(10)
      const tree = treeLayout.current.hierarchy(
        data.organization.parentOrg || data.organization
      )
      treeLayout.current(tree)
      setRoot(tree)
    }
  }, [data, getSize, getScale, distanceFromMain])

  useEffect(() => {
    if (!data || !root) {
      return
    }

    const boundingBox = root.descendants().reduce(
      (box, nodeArg) => {
        const size = getSize(nodeArg.data, getScale(nodeArg.data))
        return {
          xmin: Math.min(box.xmin, nodeArg.x || 0),
          xmax: Math.max(box.xmax, nodeArg.x + size[0] || 0),
          ymin: Math.min(box.ymin, nodeArg.y || 0),
          ymax: Math.max(box.ymax, nodeArg.y + size[1] || 0)
        }
      },
      {
        xmin: Number.MAX_SAFE_INTEGER,
        xmax: Number.MIN_SAFE_INTEGER,
        ymin: Number.MAX_SAFE_INTEGER,
        ymax: Number.MIN_SAFE_INTEGER
      }
    )

    setHeight(boundingBox.ymax - boundingBox.ymin + 50)
  }, [data, width, root, getSize, getScale])

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
        zoomFn={zoomIncrement =>
          setZoomLevel(zoomLevel * Math.pow(1.1, zoomIncrement))}
      >
        <g transform={`translate(${width / 2},50)`}>
          <g style={{ fill: "none", stroke: "#555" }}>
            {treeLayout.current &&
              treeLayout
                .current(root)
                .links()
                .map(link => (
                  <OrganizationLink
                    key={`${link.source.data.uuid}->${link.target.data.uuid}`}
                    link={link}
                  />
                ))}
          </g>
          <g style={{ cursor: "pointer", pointerEvents: "all" }}>
            {root &&
              root.descendants().map(node => {
                const org = node.data
                const positions = sortPositions(org.positions)
                const unitcode = Settings.fields.person.ranks.find(
                  element => element.value === positions?.[0]?.person?.rank
                )?.app6Modifier
                const sym = new Symbol(
                  `S${
                    org.type === Organization.TYPE.ADVISOR_ORG ? "F" : "N"
                  }GPU------${unitcode || "-"}`,
                  { size: 22 }
                )

                return (
                  <OrganizationNode
                    key={org.uuid}
                    org={org}
                    x={node.x}
                    y={node.y}
                    scale={getScale(org)}
                    size={getSize(org)}
                    symbol={sym}
                    isMain={distanceFromMain(org) === 0}
                  />
                )
              })}
          </g>
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
