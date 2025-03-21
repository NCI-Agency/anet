import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
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
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import ReactFlow, {
  EdgeProps,
  Handle,
  NodeProps,
  Position,
  ReactFlowProvider,
  useReactFlow
} from "reactflow"
import "reactflow/dist/style.css"
import Settings from "settings"
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
const ARROW_INDENT = 5
const DIAGRAM_PADDING = 100
enum PositionFilterOption {
  none = "none",
  leaders = "leaders",
  leadersDeputies = "leadersDeputies",
  topPosition = "topPosition",
  top2Positions = "top2Positions"
}
const positionsLimits = {
  [PositionFilterOption.topPosition]: 1,
  [PositionFilterOption.top2Positions]: 2
}
const ROLES = Object.keys(PositionRole)
const RANKS = Settings.fields.person.ranks.map(rank => rank.value)

interface OrganizationalChartProps {
  pageDispatchers?: PageDispatchersPropType
  org: any
  width?: number
  exportTitle?: string
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  width,
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
        width={width}
      />
    </ReactFlowProvider>
  )
}

interface OrganizationFlowChartProps {
  organization: { descendantOrgs: any[]; ascendantOrgs: any[] }
  width?: number
  exportTitle?: string
}

const OrganizationFlowChart = ({
  organization,
  width,
  exportTitle
}: OrganizationFlowChartProps) => {
  const [showApp6Symbols, setShowApp6Symbols] = useState(false)
  const [depthLimit, setDepthLimit] = useState(3)
  const [maxDepth, setMaxDepth] = useState(0)
  const [positionsFilter, setPositionsFilter] = useState<PositionFilterOption>(
    PositionFilterOption.none
  )
  const chartRef = useRef<HTMLDivElement>(null)
  const lowestDepth = useRef(0)
  const lowestY = useRef(0)
  const diagramHeight = useRef(0)
  const { fitView } = useReactFlow()

  const downloadImage = async() => {
    if (!chartRef.current) {
      return
    }

    const dataUrl = await toPng(chartRef.current, {
      backgroundColor: BACKGROUND_COLOR
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

  const reframe = useCallback(() => {
    fitView()
  }, [fitView])

  const calculateLayout = useCallback(
    (
      node: any,
      allDescendantOrgs: any[],
      allAscendantOrgs: any[],
      depth = 0,
      x = 0,
      y = 0
    ) => {
      const filterPositions = positions =>
        positions
          .filter(position => {
            if (!position.person) {
              return false
            }
            if (positionsFilter === PositionFilterOption.none) {
              return false
            }
            if (positionsFilter === PositionFilterOption.leaders) {
              return position.role === PositionRole.LEADER.toString()
            }
            if (positionsFilter === PositionFilterOption.leadersDeputies) {
              return (
                position.role === PositionRole.LEADER.toString() ||
                position.role === PositionRole.DEPUTY.toString()
              )
            }
            return true
          })
          .sort(
            (a, b) =>
              // highest position role first
              ROLES.indexOf(b.role) - ROLES.indexOf(a.role) ||
              // when these are equal, highest ranking person first
              RANKS.indexOf(b.person?.rank) - RANKS.indexOf(a.person?.rank) ||
              // when these are also equal, sort alphabetically on person name
              a.person?.name?.localeCompare(b.person?.name) ||
              // else sort by position name
              a.name?.localeCompare(b.name) ||
              // last resort: sort by position uuid
              a.uuid.localeCompare(b.uuid)
          )
          .map(position => position.person)
          .slice(0, positionsLimits[positionsFilter] ?? undefined)

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

      const symbol = determineSymbol(node, allAscendantOrgs).asDOM()
      const positions = filterPositions(node.positions)

      const currentNode = {
        id: node.uuid,
        data: {
          organization: node,
          symbol,
          positions,
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
          currentY + NODE_HEIGHT + positions.length * PERSON_AVATAR_HEIGHT
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
              positions.length * PERSON_AVATAR_HEIGHT +
              VERTICAL_SPACING * (positions.length ? 0 : 0.5)
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
              lastChild.data.positions.length * PERSON_AVATAR_HEIGHT -
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

      // update the lowestY
      if (currentY > lowestY.current) {
        lowestY.current = currentY
      }

      // update the lowest depth
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
    [depthLimit, showApp6Symbols, positionsFilter]
  )

  const { nodes, edges } = useMemo(() => {
    if (!organization) {
      return { nodes: [], edges: [] }
    }

    const maxDepth = Math.max(
      ...organization.descendantOrgs.map(org => org.ascendantOrgs.length - 1),
      0
    )
    setMaxDepth(maxDepth)
    setDepthLimit(Math.min(maxDepth, depthLimit))
    const allAscendantOrgs = utils.getAscendantObjectsAsMap(
      (organization?.ascendantOrgs ?? []).concat(
        organization?.descendantOrgs ?? []
      )
    )
    lowestY.current = 0
    diagramHeight.current = 0
    const layout = calculateLayout(
      organization,
      organization.descendantOrgs,
      allAscendantOrgs,
      0,
      0,
      0
    )
    diagramHeight.current =
      lowestY.current + NODE_HEIGHT + VERTICAL_SPACING + DIAGRAM_PADDING
    return {
      nodes: layout.nodes.map(node => ({
        ...node,
        data: { ...node.data, showApp6Symbols }
      })),
      edges: layout.edges
    }
  }, [organization, showApp6Symbols, depthLimit, calculateLayout])

  useEffect(() => {
    setTimeout(() => {
      fitView()
    })
    // we want to reframe whenever the width, depthLimit or positionsFilter change
  }, [width, depthLimit, positionsFilter, fitView])

  if (!organization) {
    return <p>Loading...</p>
  }

  return (
    <>
      <ControlsContainer>
        <div>
          <input
            type="checkbox"
            id="showApp6Symbols"
            checked={showApp6Symbols}
            onChange={toggleDisplayMode}
          />
          <label htmlFor="showApp6Symbols">APP-6 Symbols</label>
        </div>
        <select
          value={positionsFilter}
          onChange={e =>
            setPositionsFilter(e.target.value as PositionFilterOption)}
        >
          <option value={PositionFilterOption.none}>No positions</option>
          <option value={PositionFilterOption.leaders}>Leaders Only</option>
          <option value={PositionFilterOption.leadersDeputies}>
            Leaders and Deputies
          </option>
          <option value={PositionFilterOption.topPosition}>Top Position</option>
          <option value={PositionFilterOption.top2Positions}>
            Top 2 Positions
          </option>
        </select>
        <div>
          <label htmlFor="depthInput">Depth:</label>
          <div className="depth-controls">
            <Button onClick={decreaseDepthLimit}>
              <Icon icon={IconNames.REMOVE} />
            </Button>
            <input
              id="depthInput"
              type="number"
              value={utils.isNumeric(depthLimit) && depthLimit}
              onChange={e => setDepthLimit(parseInt(e.target.value, 10))}
              min="0"
              max={maxDepth}
              style={{ width: "3em" }}
            />
            <Button onClick={increaseDepthLimit}>
              <Icon icon={IconNames.ADD} />
            </Button>
          </div>
        </div>
        <Button className="reframe" onClick={reframe}>
          <Icon icon={IconNames.ZOOM_TO_FIT} />
          Reframe
        </Button>
        <Button className="export" onClick={downloadImage}>
          <Icon icon={IconNames.EXPORT} />
          Export Image
        </Button>
      </ControlsContainer>
      <div
        ref={chartRef}
        style={{
          width: width ? `${width}px` : "100%",
          height: diagramHeight.current
            ? `${diagramHeight.current}px`
            : "100vh",
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
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </>
  )
}

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background-color: #f2f2f2;

  div {
    display: flex;
    align-items: center;
    gap: 6px;

    & label {
      cursor: pointer;
    }

    &.depth-controls {
      gap: 0;
      background-color: white;
      border-radius: 6px;
      border: 1px solid #e5e5e5;

      .btn {
        border: none;

        &:hover {
          background-color: #f4f4f4;
        }

        &:first-of-type {
          border-radius: 6px 0 0 6px;
          border-right: 1px solid #e5e5e5;
        }

        &:last-of-type {
          border-radius: 0 6px 6px 0;
          border-left: 1px solid #e5e5e5;
        }
      }

      input {
        border: none;
        text-align: center;
        font-size: 14px;
        color: #444444;

        /* Chrome, Safari, Edge, Opera */
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        &[type="number"] {
          -moz-appearance: textfield;
        }

        &:focus {
          outline: none;
          border-color: #2563eb;
        }
      }
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
    color: #444444;
    user-select: none;
  }

  .btn {
    padding: 8px 16px;
    font-size: 14px;
    background-color: white;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    cursor: pointer;
    color: #444444;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;

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

const CustomNode = ({
  data: { organization, symbol, depth, positions, showSymbol }
}: NodeProps) => {
  const svg = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (svg.current) {
      if (svg.current.firstChild) {
        svg.current.replaceChild(symbol, svg.current.firstChild)
      } else {
        svg.current.appendChild(symbol)
      }
    }
  }, [symbol])
  return (
    <div
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT + positions.length * PERSON_AVATAR_HEIGHT,
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
            justifyContent: "center",
            minWidth: ORG_AVATAR_WIDTH,
            height: NODE_HEIGHT
          }}
        >
          {(showSymbol && <div ref={svg} />) || (
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
      {positions.length > 0 && (
        <div
          style={{
            paddingLeft: ORG_AVATAR_WIDTH / 2
          }}
        >
          {positions.map(person => (
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
          left: depth === 1 ? ORG_AVATAR_WIDTH / 2 : -ARROW_INDENT,
          top: depth === 1 ? 0 : NODE_HEIGHT / 2
        }}
      />
    </div>
  )
}

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
