/* eslint-disable */

import { gql } from "@apollo/client"
import API from "api"
import SVGCanvas from "components/graphs/SVGCanvas"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
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
import useD3Transition from "use-d3-transition"

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

const OrganizationLink = ({ link }) => {
  const d = d3
    .linkVertical()
    .x(d => d.x)
    .y(d => d.y)(link)

  const { ref, attrState } = useD3Transition({
    attrsToTransitionTo: { d },
    deps: [link],
  })
  return <path ref={ref} strokeOpacity={0.4} d={attrState.d} />
}

OrganizationLink.propTypes = {
  link: PropTypes.object.isRequired,
}

const OrganizationNode = ({ org, x, y, scale, size, symbol, isMain }) => {
  const history = useHistory()

  const transform = `translate(${x},${y}) scale(${scale} ${scale})`
  const background = isMain
    ? "rgba(255, 255, 255, 1)"
    : "rgba(230, 230, 230, 0.5)"

  const { ref, attrState } = useD3Transition({
    attrsToTransitionTo: { transform, background },
    deps: [x, y, isMain],
  })

  return (
    <g ref={ref} className="org" key={org.uuid} transform={attrState.transform}>
      <rect
        rx="7"
        ry="7"
        x={-size[0] / 2}
        y={15}
        width={size[0]}
        height={size[1] - 100 * scale}
        style={{
          fill: attrState.background,
          stroke: isMain ? "black" : "none",
        }}
      />
      <g className="orgDetails" transform="translate(-8,-15)">
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

        {sortPositions(org.positions, 10).map((position, i) => {
          const positionText = `${
            position.person ? position.person.rank : ""
          } ${position.person ? position.person.name : "unfilled"} ${
            position.name
          }`

          return (
            <g
              key={position.uuid}
              transform={`translate(-63,${87 + i * 11})`}
              onClick={() => history.push(Position.pathFor(org))}
            >
              <image
                width={13}
                height={13}
                y={-10}
                href={position.person?.avatar || DEFAULT_AVATAR}
              />
              <text
                x={18}
                fontSize="9px"
                fontFamily="monospace"
                textAnchor="start"
              >
                {positionText.length > 31
                  ? positionText.substring(0, 28) + "..."
                  : positionText}
              </text>
            </g>
          )
        })}
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
  isMain: PropTypes.bool,
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle,
  width,
  height: initialHeight,
}) => {
  const svgRef = useRef(null)
  const treeLayout = useRef(null)
  const [root, setRoot] = useState(null)
  const [height, setHeight] = useState(initialHeight)
  const { loading, error, data } = API.useApiQuery(GQL_GET_CHART_DATA, {
    uuid: org.uuid,
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers,
  })

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
    data,
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
    }
  }, [data, isParent, getSize, isMain])

  useEffect(() => {
    if (!data || !root) {
      return
    }

    setHeight(1000)
  }, [data, height, width, root])

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
                    isMain={isMain(org)}
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
  height: PropTypes.number.isRequired,
}

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
