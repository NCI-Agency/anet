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
import React, { useEffect, useRef, useState, useCallback } from "react"
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
  const svgRef = useRef(null)
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
                .map((d, i) => {
                  return (
                    <path
                      strokeOpacity={0.3}
                      key={i}
                      d={d3
                        .linkVertical()
                        .x(d => d.x)
                        .y(d => d.y)(d)}
                    />
                  )
                })}
          </g>
          <g style={{ cursor: "pointer", pointerEvents: "all" }}>
            {root?.descendants().map(d => {
              const org = d.data
              const scale = getScale(org)
              const size = getSize(org)
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
                <g
                  className="org"
                  key={`${org.uuid}`}
                  transform={`translate(${d.x},${d.y}) scale(${scale} ${scale})`}
                >
                  <rect
                    rx="7"
                    ry="7"
                    x={-size[0] / 2}
                    y={15}
                    width={size[0]}
                    height={size[1] - 100 * scale}
                    style={{
                      fill: isMain(org)
                        ? "rgba(255, 255, 255, 1)"
                        : "rgba(230, 230, 230, 0.5)",
                      stroke: isMain(org) ? "black" : "none"
                    }}
                  />
                  <g className="orgDetails" transform="translate(-8,-15)">
                    <g
                      onClick={() => history.push(Organization.pathFor(org))}
                      dangerouslySetInnerHTML={{ __html: sym.asSVG() }}
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
                      const result = `${
                        position.person ? position.person.rank : ""
                      } ${
                        position.person ? position.person.name : "unfilled"
                      } ${position.name}`

                      return (
                        <g
                          key={position.uuid}
                          transform={`translate(-63,${87 + i * 11})`}
                          onClick={() => history.push(Position.pathFor(d))}
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
                            {result.length > 31
                              ? result.substring(0, 28) + "..."
                              : result}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </g>
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
