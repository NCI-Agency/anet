import { gql } from "@apollo/client"
import styled from "@emotion/styled"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { toPng } from "html-to-image"
import ms from "milsymbol"
import { Organization } from "models"
import { PositionRole } from "models/Position"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { connect } from "react-redux"
import ReactFlow, {
  EdgeProps,
  Handle,
  NodeProps,
  Position,
  ReactFlowProvider
} from "reactflow"
import "reactflow/dist/style.css"
import utils from "utils"

const GQL_GET_CHART_DATA = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      app6context
      app6standardIdentity
      app6symbolSet
      app6hq
      app6amplifier
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      ascendantOrgs {
        uuid
        app6context
        app6standardIdentity
        app6symbolSet
        parentOrg {
          uuid
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
        app6context
        app6standardIdentity
        app6symbolSet
        app6hq
        app6amplifier
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        childrenOrgs(query: { status: ACTIVE }) {
          uuid
        }
        ascendantOrgs {
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
    }
  }
`

const BACKGROUND_COLOR = "#fafafa"
const ORG_AVATAR_WIDTH = 60
const TEXT_WIDTH = 200
const TEXT_GAP = 10
const NODE_WIDTH = ORG_AVATAR_WIDTH / 2 + TEXT_GAP + TEXT_WIDTH
const NODE_HEIGHT = 60
const VERTICAL_SPACING = 20
const HORIZONTAL_SPACING = 10
const LEVEL_INDENT = 60
const PERSON_AVATAR_HEIGHT = 42
type PeopleFilterOption =
  | "none"
  | "leaders"
  | "leaders_deputies"
  | "highest_rank"
  | "highest_2_ranks"
const rolePriority = {
  [PositionRole.LEADER.toString()]: 1,
  [PositionRole.DEPUTY.toString()]: 2,
  [PositionRole.MEMBER.toString()]: 3
}
const peopleLimits = {
  highest_rank: 1,
  highest_2_ranks: 2
}

interface OrganizationalChartProps {
  pageDispatchers?: PageDispatchersPropType
  org: any
  exportTitle?: string
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle
}: OrganizationalChartProps) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_CHART_DATA, {
    uuid: org.uuid
  })

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  if (done) {
    return result
  }

  const organization = data?.organization
  if (!organization) {
    return <p>Loading...</p>
  }

  return (
    <ReactFlowProvider>
      <OrganizationFlowChart
        organization={organization}
        exportTitle={exportTitle}
      />
    </ReactFlowProvider>
  )
}

interface OrganizationFlowChartProps {
  organization: { descendantOrgs: any[]; ascendantOrgs: any[] }
  exportTitle?: string
}

const OrganizationFlowChart = ({
  organization,
  exportTitle
}: OrganizationFlowChartProps) => {
  const [showApp6Symbols, setShowApp6Symbols] = useState(false)
  const [depthLimit, setDepthLimit] = useState(3)
  const [maxDepth, setMaxDepth] = useState(0)
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilterOption>("none")
  const chartRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const lowestDepth = useRef(0)

  const downloadImage = async() => {
    if (!chartRef.current) {
      return
    }

    // Wait for the next tick to ensure DOM updates
    await new Promise(resolve => setTimeout(resolve, 50))
    const dataUrl = await toPng(chartRef.current, {
      backgroundColor: BACKGROUND_COLOR,
      filter: node => !controlsRef.current?.contains(node)
    })

    const link = document.createElement("a")
    link.download = exportTitle + ".png"
    link.href = dataUrl
    link.click()
  }

  const determineSymbol = (org, allAscendantOrgs) => {
    const ascendantOrgs =
      utils
        .getAscendantObjectsAsList(org, allAscendantOrgs, "parentOrg")
        ?.reverse() || []
    const context = utils.determineApp6field(ascendantOrgs, "app6context", "0")
    const standardIdentity = utils.determineApp6field(
      ascendantOrgs,
      "app6standardIdentity",
      "1"
    )
    const symbolSet = utils.determineApp6field(
      ascendantOrgs,
      "app6symbolSet",
      "00"
    )
    const hq = org?.app6hq || "0"
    const amplifier = org?.app6amplifier || "00"
    const version = "10" // APP-6D
    const status = "0" // Present
    return new ms.Symbol(
      `${version}${context}${standardIdentity}${symbolSet}${status}${hq}${amplifier}`,
      {
        size: 30
      }
    )
  }

  const toggleDisplayMode = () => {
    setShowApp6Symbols(prev => !prev)
  }

  const increaseDepthLimit = () => {
    setDepthLimit(prev => Math.min(prev + 1, maxDepth))
  }

  const decreaseDepthLimit = () => {
    setDepthLimit(prev => Math.max(0, prev - 1))
  }

  const calculateLayout = useCallback(
    (
      node: any,
      allDescendantOrgs: any[],
      allAscendantOrgs: any[],
      depth = 0,
      x = 0,
      y = 0
    ) => {
      const filterPeople = people => {
        return people
          .filter(position => {
            if (!position.person) {
              return false
            }
            if (peopleFilter === "none") {
              return false
            }
            if (peopleFilter === "leaders") {
              return position.role === PositionRole.LEADER.toString()
            }
            if (peopleFilter === "leaders_deputies") {
              return (
                position.role === PositionRole.LEADER.toString() ||
                position.role === PositionRole.DEPUTY.toString()
              )
            }
            return true
          })
          .sort((a, b) => {
            return rolePriority[a.role] - rolePriority[b.role]
          })
          .map(position => position.person)
          .slice(0, peopleLimits[peopleFilter] ?? undefined)
      }

      if (!node || depth > depthLimit) {
        return { nodes: [], edges: [] }
      }

      const children =
        allDescendantOrgs.filter(
          descendant => descendant.parentOrg.uuid === node.uuid
        ) || []
      const isRoot = depth === 0
      const currentX = isRoot ? 0 : x
      const currentY = isRoot ? 0 : y

      const symbol = determineSymbol(node, allAscendantOrgs).asSVG()
      const people = filterPeople(node.positions)

      const currentNode = {
        id: node.uuid,
        data: {
          organization: node,
          symbol,
          people,
          depth,
          showSymbol: showApp6Symbols
        },
        position: { x: currentX, y: currentY },
        type: "custom"
      }

      let nodes = [currentNode]
      let edges = []
      if (children.length > 0) {
        let childX = currentX + (isRoot ? 0 : LEVEL_INDENT)
        let childY =
          currentY + NODE_HEIGHT + people.length * PERSON_AVATAR_HEIGHT
        children.forEach(child => {
          // first level nodes are placed horizontally
          if (isRoot) {
            childX += NODE_WIDTH + HORIZONTAL_SPACING + TEXT_GAP
            if (lowestDepth.current > 1) {
              childX += (lowestDepth.current - 1) * LEVEL_INDENT
            }
            childY =
              currentY +
              NODE_HEIGHT * 1.5 +
              people.length * PERSON_AVATAR_HEIGHT +
              VERTICAL_SPACING * (people.length ? 0 : 0.5)
            // reset lowestDepth as we enter a new branch
            lowestDepth.current = 0
          }

          const childLayout = calculateLayout(
            child,
            allDescendantOrgs,
            allAscendantOrgs,
            depth + 1,
            childX,
            childY
          )
          // use the last child's position to determine the next child's position
          const lastChild = childLayout.nodes.slice(-1)[0]
          if (lastChild && !isRoot) {
            childY =
              lastChild.position.y +
              lastChild.data.people.length * PERSON_AVATAR_HEIGHT -
              VERTICAL_SPACING
          }

          nodes = nodes.concat(childLayout.nodes)
          edges = edges.concat(childLayout.edges)

          edges.push({
            id: `edge-${node.uuid}-${child.uuid}`,
            source: node.uuid,
            target: child.uuid,
            sourceHandle: isRoot ? "bottom" : "left",
            targetHandle: depth === 0 ? "top" : "left",
            type: isRoot ? "rootEdge" : "smoothstep",
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: { type: "arrowclosed", color: "#94a3b8" }
          })

          if (!isRoot) {
            childY += NODE_HEIGHT + VERTICAL_SPACING
          }
        })
      }
      if (depth > lowestDepth.current) {
        lowestDepth.current = depth
      }

      // place the root node in the middle of its children
      if (isRoot && nodes.length > 1) {
        const directChildNodes = nodes
          .slice(1)
          .filter(({ data }) => data?.depth === 1)
        const childCount = directChildNodes.length
        if (childCount > 0) {
          if (childCount % 2 === 0) {
            const middleLeft = directChildNodes[childCount / 2 - 1]
            const middleRight = directChildNodes[childCount / 2]
            nodes[0].position.x =
              (middleLeft.position.x + middleRight.position.x) / 2
          } else {
            const middle = directChildNodes[Math.floor(childCount / 2)]
            nodes[0].position.x = middle.position.x
          }
        }
      }
      return { nodes, edges }
    },
    [depthLimit, showApp6Symbols, peopleFilter]
  )

  const { nodes, edges } = useMemo(() => {
    if (!organization) {
      return { nodes: [], edges: [] }
    }

    let maxDepth = 0
    organization.descendantOrgs.forEach(org => {
      if (org.ascendantOrgs.length - 1 > maxDepth) {
        maxDepth = org.ascendantOrgs.length - 1
      }
    })
    setMaxDepth(maxDepth)
    setDepthLimit(Math.min(maxDepth, depthLimit))
    const allAscendantOrgs = utils.getAscendantObjectsAsMap(
      (organization?.ascendantOrgs ?? []).concat(
        organization?.descendantOrgs ?? []
      )
    )
    const layout = calculateLayout(
      organization,
      organization.descendantOrgs,
      allAscendantOrgs,
      0,
      0,
      0
    )

    return {
      nodes: layout.nodes.map(node => ({
        ...node,
        data: { ...node.data, showApp6Symbols }
      })),
      edges: layout.edges
    }
  }, [organization, showApp6Symbols, depthLimit, calculateLayout])

  if (!organization) {
    return <p>Loading...</p>
  }

  return (
    <div
      ref={chartRef}
      style={{
        height: "calc(100vh - 200px)",
        width: "100%",
        backgroundColor: BACKGROUND_COLOR
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
      >
        <ControlsContainer ref={controlsRef}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "6px"
            }}
          >
            <input
              type="checkbox"
              id="showApp6Symbols"
              checked={showApp6Symbols}
              onChange={toggleDisplayMode}
            />
            <label htmlFor="showApp6Symbols">APP-6 Symbols</label>
          </div>
          <select
            value={peopleFilter}
            onChange={e =>
              setPeopleFilter(e.target.value as PeopleFilterOption)}
          >
            <option value="none">No positions</option>
            <option value="leaders">Leaders Only</option>
            <option value="leaders_deputies">Leaders and Deputies</option>
            <option value="highest_rank">Highest Rank</option>
            <option value="highest_2_ranks">Highest 2 Ranks</option>
          </select>
          <div>
            <button type="button" onClick={increaseDepthLimit}>
              + Depth
            </button>
            <button type="button" onClick={decreaseDepthLimit}>
              - Depth
            </button>
          </div>
          <button type="button" className="export" onClick={downloadImage}>
            Export Image
          </button>
        </ControlsContainer>
      </ReactFlow>
    </div>
  )
}

const ControlsContainer = styled.div`
  position: absolute;
  display: flex;
  top: 20px;
  left: 20px;
  gap: 12px;
  z-index: 10;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);

  div {
    display: flex;
    align-items: center;
    gap: 6px;

    & label {
      cursor: pointer;
    }
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
    outline: none;
  }

  label {
    font-size: 14px;
    color: #374151;
    user-select: none;
  }

  button {
    padding: 8px 16px;
    font-size: 14px;
    background-color: white;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    cursor: pointer;
    color: #444444;
    transition: all 0.2s;

    &:hover {
      background-color: #f4f4f4;
      border-color: #2563eb;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      background-color: #e5e5e5;
    }

    &.export {
      background-color: #2563eb;
      color: white;

      &:hover {
        background-color: #1d4ed8;
      }
    }
  }

  select {
    padding: 8px 32px 8px 12px;
    font-size: 14px;
    background-color: white;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    cursor: pointer;
    color: #444444;
    transition: all 0.2s;
    outline: none;

    &:hover {
      border-color: #2563eb;
    }
  }
`
const SvgComponent = ({ svgElement }) => {
  const svgRef = useRef(null)

  useEffect(() => {
    if (svgRef.current && svgElement) {
      svgRef.current.innerHTML = new XMLSerializer().serializeToString(
        svgElement
      )
    }
  }, [svgElement])

  return <div ref={svgRef} />
}

const parseSvgStringToJSX = (svgString: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, "image/svg+xml")
  const svgElement = doc.documentElement

  svgElement.setAttribute("width", "60px")

  return <SvgComponent svgElement={svgElement} />
}

const CustomNode = ({
  data: { organization, symbol, depth, people, showSymbol }
}: NodeProps) => (
  <div
    style={{
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      display: "flex",
      flexDirection: "column"
    }}
  >
    <div
      style={{
        display: "flex"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: ORG_AVATAR_WIDTH,
          height: NODE_HEIGHT
        }}
      >
        {showSymbol && symbol && parseSvgStringToJSX(symbol)}
        {!showSymbol && (
          <EntityAvatarDisplay
            avatar={organization.entityAvatar}
            defaultAvatar={Organization.relatedObjectType}
            width={ORG_AVATAR_WIDTH}
            height={ORG_AVATAR_WIDTH}
            style={{ backgroundColor: BACKGROUND_COLOR }}
          />
        )}
      </div>
      <LinkTo
        modelType="Organization"
        model={organization}
        showAvatar={false}
        showIcon={false}
        style={{
          minHeight: NODE_HEIGHT,
          display: "flex",
          padding: "5px 0px 5px 5px",
          alignItems: "center"
        }}
      />
    </div>
    {people.length > 0 && (
      <div
        style={{
          paddingLeft: ORG_AVATAR_WIDTH / 2
        }}
      >
        {people.map(person => (
          <LinkTo
            key={person.uuid}
            modelType="Person"
            model={person}
            showIcon={false}
            style={{
              display: "inline-block",
              maxWidth: TEXT_WIDTH,
              padding: "5px 0px 5px 5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              verticalAlign: "middle"
            }}
          />
        ))}
      </div>
    )}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ opacity: 0, top: NODE_HEIGHT / 2, left: ORG_AVATAR_WIDTH / 2 }}
    />
    <Handle
      type="target"
      position={depth > 1 ? Position.Left : Position.Top}
      style={{
        opacity: 0,
        left: depth === 1 ? ORG_AVATAR_WIDTH / 2 : 0
      }}
    />
  </div>
)

const CustomRootEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd
}: EdgeProps) => {
  const cornerRadius = 4
  const verticalMargin = 20
  const horizontalDirection = targetX > sourceX ? 1 : -1
  const turnX = targetX - horizontalDirection * cornerRadius

  let path = `
    M ${sourceX},${sourceY}
    V ${targetY - verticalMargin}
  `
  if (Math.abs(targetX - sourceX) > 0) {
    path += `
      Q ${sourceX},${targetY - verticalMargin} ${sourceX + horizontalDirection * cornerRadius},${targetY - verticalMargin}
      H ${turnX}
      Q ${targetX},${targetY - verticalMargin} ${targetX},${targetY - verticalMargin + cornerRadius}
    `
  }

  path += `V ${targetY} `

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={path}
      fill="none"
      markerEnd={markerEnd}
    />
  )
}

const nodeTypes = { custom: CustomNode }
const edgeTypes = { rootEdge: CustomRootEdge }

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
