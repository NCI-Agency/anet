import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import API from "api"
import App6Symbol from "components/App6Symbol"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import { toPng } from "html-to-image"
import { Organization } from "models"
import { PositionRole } from "models/Position"
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react"
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
      ${gqlEntityFieldsMap.Organization}
      app6context
      app6standardIdentity
      app6symbolSet
      app6hq
      app6amplifier
      app6entity
      app6entityType
      app6entitySubtype
      app6sectorOneModifier
      app6sectorTwoModifier
      positions {
        ${gqlEntityFieldsMap.Position}
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      ascendantOrgs {
        ${gqlEntityFieldsMap.Organization}
        app6context
        app6standardIdentity
        app6symbolSet
        parentOrg {
          ${gqlEntityFieldsMap.Organization}
        }
      }
      childrenOrgs(query: { status: ACTIVE }) {
        ${gqlEntityFieldsMap.Organization}
      }
      descendantOrgs(query: { status: ACTIVE }) {
        ${gqlEntityFieldsMap.Organization}
        app6context
        app6standardIdentity
        app6symbolSet
        app6hq
        app6amplifier
        app6entity
        app6entityType
        app6entitySubtype
        app6sectorOneModifier
        app6sectorTwoModifier
        childrenOrgs(query: { status: ACTIVE }) {
          ${gqlEntityFieldsMap.Organization}
        }
        ascendantOrgs {
          ${gqlEntityFieldsMap.Organization}
          app6context
          app6standardIdentity
          app6symbolSet
          parentOrg {
            ${gqlEntityFieldsMap.Organization}
          }
        }
        parentOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        positions {
          ${gqlEntityFieldsMap.Position}
          role
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
          person {
            ${gqlEntityFieldsMap.Person}
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
const NODE_SPACING = 10
const HORIZONTAL_SPACING = 10
const LEVEL_INDENT = 60
const PERSON_AVATAR_HEIGHT = 42
const ARROW_INDENT = 5
const DIAGRAM_PADDING = 20
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
  const { topbarOffset } = useContext(ResponsiveLayoutContext)
  const [showApp6Symbols, setShowApp6Symbols] = useState(false)
  const [depthLimit, setDepthLimit] = useState(3)
  const [maxDepth, setMaxDepth] = useState(0)
  const [positionsFilter, setPositionsFilter] = useState<PositionFilterOption>(
    PositionFilterOption.none
  )
  const chartRef = useRef<HTMLDivElement>(null)
  const [diagramWidth, setDiagramWidth] = useState(1)
  const [diagramHeight, setDiagramHeight] = useState(1)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const lowestDepth = useRef(0)
  useReactFlow()

  const downloadImage = async () => {
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

  const determineSymbolValues = org => {
    const { parentContext, parentStandardIdentity, parentSymbolSet } =
      Organization.getApp6ParentFields(org, org)
    return {
      ...org,
      app6context: org.app6context || parentContext,
      app6standardIdentity: org.app6standardIdentity || parentStandardIdentity,
      app6symbolSet: org.app6symbolSet || parentSymbolSet
    }
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

      const symbolValues = determineSymbolValues(node)
      const positions = filterPositions(node.positions)

      const currentNode = {
        id: node.uuid,
        data: {
          organization: node,
          symbolValues,
          positions,
          depth
        },
        position: { x: currentX, y: currentY },
        type: "custom"
      }

      let newNodes = [currentNode]
      let newEdges = []
      if (children.length > 0) {
        let childX = currentX + (isRoot ? 0 : LEVEL_INDENT)
        let childY =
          currentY +
          NODE_HEIGHT +
          positions.length * PERSON_AVATAR_HEIGHT +
          NODE_SPACING
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

          newNodes = newNodes.concat(childLayout.nodes)
          newEdges = newEdges.concat(childLayout.edges)

          newEdges.push({
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
            childY += NODE_HEIGHT + VERTICAL_SPACING + NODE_SPACING
          }
        })
      }

      // update the lowest depth
      if (depth > lowestDepth.current) {
        lowestDepth.current = depth
      }

      // place the root node in the middle of its children
      if (isRoot && newNodes.length > 1) {
        const directChildNodes = newNodes
          .slice(1)
          .filter(({ data }) => data?.depth === 1)
        const childCount = directChildNodes.length
        if (childCount > 0) {
          if (childCount % 2 === 0) {
            const middleLeft = directChildNodes[childCount / 2 - 1]
            const middleRight = directChildNodes[childCount / 2]
            newNodes[0].position.x =
              (middleLeft.position.x + middleRight.position.x) / 2
          } else {
            const middle = directChildNodes[Math.floor(childCount / 2)]
            newNodes[0].position.x = middle.position.x
          }
        }
      }
      return { nodes: newNodes, edges: newEdges }
    },
    [depthLimit, positionsFilter]
  )

  useEffect(() => {
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
    const layout = calculateLayout(
      organization,
      organization.descendantOrgs,
      allAscendantOrgs,
      0,
      0,
      0
    )

    setNodes(
      layout.nodes.map(node => ({
        ...node,
        data: { ...node.data, showSymbol: showApp6Symbols }
      }))
    )
    setEdges(layout.edges)
  }, [organization, depthLimit, showApp6Symbols, calculateLayout])

  const reframe = useCallback(() => {
    if (!reactFlowInstance || !nodes?.length) {
      return
    }

    // calculate bounds of the nodes
    const minX = Math.min(...nodes.map(n => n.position.x))
    const maxX = Math.max(...nodes.map(n => n.position.x + NODE_WIDTH))
    const minY = Math.min(...nodes.map(n => n.position.y))
    const maxY = Math.max(
      ...nodes.map(
        n =>
          n.position.y +
          NODE_HEIGHT +
          (n?.data?.positions?.length ?? 0) * PERSON_AVATAR_HEIGHT
      )
    )

    // calculate size within the nodes
    const graphW = maxX - minX
    const graphH = maxY - minY
    const containerW = width
    const containerH = window.innerHeight - topbarOffset

    // find the zoom, with a max value of 1
    const zoom = Math.min(
      1,
      (containerW - DIAGRAM_PADDING * 2) / graphW,
      (containerH - DIAGRAM_PADDING * 2) / graphH
    )

    // get final dimensions, width can't be lower than container width
    const scaledW = Math.max(containerW, graphW * zoom + DIAGRAM_PADDING * 2)
    const scaledH = graphH * zoom + DIAGRAM_PADDING * 2
    setDiagramWidth(scaledW)
    setDiagramHeight(scaledH)

    // center the graph
    const translateX = (scaledW - graphW * zoom) / 2 - minX * zoom
    const translateY = (scaledH - graphH * zoom) / 2 - minY * zoom
    reactFlowInstance.setViewport({ x: translateX, y: translateY, zoom })
  }, [reactFlowInstance, nodes, width, topbarOffset])

  useEffect(() => {
    reframe()
  }, [reframe])

  if (!organization || !nodes?.length) {
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
            setPositionsFilter(e.target.value as PositionFilterOption)
          }
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
            <Button onClick={decreaseDepthLimit} disabled={depthLimit === 0}>
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
            <Button
              onClick={increaseDepthLimit}
              disabled={depthLimit === maxDepth}
            >
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
      <DivS
        ref={chartRef}
        width={`${diagramWidth}px`}
        height={`${diagramHeight}px`}
        backgroundColor={BACKGROUND_COLOR}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        />
      </DivS>
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
const CustomOrgLinkS = styled.div`
  span {
    display: flex;
    height: ${NODE_HEIGHT}px;
    overflow: hidden;
  }
`
const LinkToOrgS = styled(LinkTo)`
  margin: auto;
  padding-left: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  /* limit to max. 3 lines */
  line-clamp: 3;
  /* legacy WebKit fallback */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`
const LinkToPersonS = styled(LinkTo)`
  display: inline-block;
  max-width: ${TEXT_WIDTH}px;
  padding: 5px 0 5px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
`
const HandleS = styled(Handle)`
  opacity: 0;
  left: ${props => props.left};
  top: ${props => props.top};
`

const DivS = styled.div`
  width: ${props => props.width};
  max-width: ${props => props.maxWidth};
  min-width: ${props => props.minWidth};
  height: ${props => props.height};
  padding-left: ${props => props.paddingLeft};
  background-color: ${props => props.backgroundColor};
`

const CustomNode = ({
  data: { organization, symbolValues, depth, positions, showSymbol }
}: NodeProps) => (
  <DivS
    className="d-flex flex-column"
    width={`${NODE_WIDTH}px`}
    height={`${NODE_HEIGHT + positions.length * PERSON_AVATAR_HEIGHT}px`}
  >
    <div className="d-flex">
      <DivS
        className="d-flex align-items-center justify-content-center"
        minWidth={`${ORG_AVATAR_WIDTH}px`}
        height={`${NODE_HEIGHT}px`}
      >
        {(showSymbol && (
          <App6Symbol
            values={symbolValues}
            size={ORG_AVATAR_WIDTH}
            maxHeight={NODE_HEIGHT}
          />
        )) || (
          <EntityAvatarDisplay
            avatar={organization.entityAvatar}
            defaultAvatar={Organization.relatedObjectType}
            width={ORG_AVATAR_WIDTH}
            height={ORG_AVATAR_WIDTH}
            style={{ backgroundColor: BACKGROUND_COLOR }}
          />
        )}
      </DivS>
      <CustomOrgLinkS>
        <LinkToOrgS
          modelType="Organization"
          model={organization}
          showAvatar={false}
          showIcon={false}
        />
      </CustomOrgLinkS>
    </div>
    {positions.length > 0 && (
      <DivS paddingLeft={`${ORG_AVATAR_WIDTH / 2}px`}>
        {positions.map(person => (
          <LinkToPersonS
            key={person.uuid}
            modelType="Person"
            model={person}
            showIcon={false}
          />
        ))}
      </DivS>
    )}
    <HandleS
      type="source"
      position={Position.Bottom}
      left={`${ORG_AVATAR_WIDTH / 2}px`}
      top={`${NODE_HEIGHT / 2}px`}
    />
    <HandleS
      type="target"
      position={depth > 1 ? Position.Left : Position.Top}
      left={`${depth === 1 ? ORG_AVATAR_WIDTH / 2 : -ARROW_INDENT}px`}
      top={`${depth === 1 ? 0 : NODE_HEIGHT / 2}px`}
    />
  </DivS>
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
