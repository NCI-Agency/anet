import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _xor from "lodash/xor"
import ms from "milsymbol"
import { Organization } from "models"
import React, { useMemo, useState } from "react"
import { connect } from "react-redux"
import ReactFlow, {
  Background,
  Handle,
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
const AVATAR_WIDTH = 60
const TEXT_GAP = 10
const TEXT_WIDTH = 200
const NODE_WIDTH = (AVATAR_WIDTH / 2 + TEXT_GAP + TEXT_WIDTH) * 2
const NODE_HEIGHT = 60
const VERTICAL_SPACING = 60
const SECONDARY_VERTICAL_SPACING = 20
const HORIZONTAL_SPACING = -TEXT_WIDTH + 20
const LEVEL_INDENT = 60
const PERSON_AVATAR_HEIGHT = 42
type PeopleFilterOption = "none" | "leaders" | "deputies" | "both"

interface OrganizationalChartProps {
  pageDispatchers?: PageDispatchersPropType
  org: any
  exportTitle?: string
  width?: number
  height?: number
}

const OrganizationalChart = ({
  pageDispatchers,
  org,
  exportTitle,
  width = 100,
  height: initialHeight = 100
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

  if (!data || !data.organization) {
    return <p>Loading...</p>
  }

  return (
    <ReactFlowProvider>
      <OrbatChart data={data} />
    </ReactFlowProvider>
  )
}

const OrbatChart = ({ data }) => {
  const [showAPP6Symbols, setshowAPP6Symbols] = useState(false)
  const [depthLimit, setDepthLimit] = useState(3)
  const [maxDepth, setMaxDepth] = useState(0)
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilterOption>("none")

  let lowestDepth = 0

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
    const version = "14" // APP-6E
    const status = "0" // Present
    return new ms.Symbol(
      `${version}${context}${standardIdentity}${symbolSet}${status}${hq}${amplifier}`,
      {
        size: 30
      }
    )
  }

  const calculateMaxDepth = data => {
    let maxDepth = 0
    data.organization.descendantOrgs.forEach(org => {
      if (org.ascendantOrgs.length - 1 > maxDepth) {
        maxDepth = org.ascendantOrgs.length - 1
      }
    })

    return maxDepth
  }

  const toggleDisplayMode = () => {
    setshowAPP6Symbols(prev => !prev)
  }

  const increaseDepthLimit = () => {
    setDepthLimit(prev => Math.min(prev + 1, maxDepth))
  }

  const decreaseDepthLimit = () => {
    setDepthLimit(prev => Math.max(0, prev - 1))
  }

  if (!data) {
    return <p>Loading...</p>
  }

  const calculateLayout = (
    node,
    allDescendantOrgs,
    allAscendantOrgs,
    depth = 0,
    x = 0,
    y = 0
  ) => {
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

    const label = node.longName
      ? `${node.shortName}: ${node.longName}`
      : node.shortName
    const symbol = determineSymbol(node, allAscendantOrgs).asSVG()
    const people = node.positions
      .filter(position => {
        if (!position.person) {
          return false
        }
        if (peopleFilter === "none") {
          return false
        }
        if (peopleFilter === "leaders") {
          return position.role === "LEADER"
        }
        if (peopleFilter === "deputies") {
          return position.role === "DEPUTY"
        }
        return position.role === "LEADER" || position.role === "DEPUTY"
      })
      .map(position => position.person)
    const currentNode = {
      id: node.uuid,
      data: {
        organization: node,
        label,
        symbol,
        people,
        depth,
        showSymbol: showAPP6Symbols,
        hasChildren: children.length > 0
      },
      position: { x: currentX, y: currentY },
      type: "custom"
    }

    let nodes = [currentNode]
    let edges = []
    if (children.length > 0) {
      let childX = currentX + (isRoot ? 0 : LEVEL_INDENT)
      let childY =
        currentY + people.length * PERSON_AVATAR_HEIGHT + VERTICAL_SPACING
      children.forEach(child => {
        // first level nodes are placed horizontally
        if (isRoot) {
          childX += NODE_WIDTH + HORIZONTAL_SPACING + TEXT_GAP
          if (lowestDepth > 1) {
            childX += (lowestDepth - 1) * LEVEL_INDENT
          }
          childY =
            currentY +
            NODE_HEIGHT +
            people.length * PERSON_AVATAR_HEIGHT +
            VERTICAL_SPACING
          // reset lowestDepth as we enter a new branch
          lowestDepth = 0
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
            SECONDARY_VERTICAL_SPACING
        }

        nodes = nodes.concat(childLayout.nodes)
        edges = edges.concat(childLayout.edges)

        edges.push({
          id: `edge-${node.uuid}-${child.uuid}`,
          source: node.uuid,
          target: child.uuid,
          sourceHandle: isRoot ? "bottom" : "left",
          targetHandle: depth === 0 ? "top" : "left",
          type: "smoothstep",
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          markerEnd: { type: "arrowclosed", color: "#94a3b8" }
        })

        if (!isRoot) {
          childY += NODE_HEIGHT + SECONDARY_VERTICAL_SPACING
        }
      })
    }
    if (depth > lowestDepth) {
      lowestDepth = depth
    }
    if (isRoot && nodes.length > 1) {
      let lowestX = nodes[1].position.x
      let highestX = lowestX
      nodes
        .slice(1)
        .filter(({ data }) => data?.depth == 1)
        .forEach(({ position }) => {
          const x = position.x
          if (x < lowestX) {
            lowestX = x
          } else if (x > highestX) {
            highestX = x
          }
        })
      nodes[0].position.x = (lowestX + highestX) / 2
    }
    return { nodes, edges }
  }

  const { nodes, edges } = useMemo(() => {
    if (!data?.organization) {
      return { nodes: [], edges: [] }
    }

    const calculatedMaxDepth = calculateMaxDepth(data)
    setMaxDepth(calculatedMaxDepth)
    setDepthLimit(Math.min(calculatedMaxDepth, depthLimit))
    const allAscendantOrgs = utils.getAscendantObjectsAsMap(
      (data.organization?.ascendantOrgs ?? []).concat(
        data.organization?.descendantOrgs ?? []
      )
    )
    const layout = calculateLayout(
      data.organization,
      data.organization.descendantOrgs,
      allAscendantOrgs,
      0,
      0,
      0
    )

    return {
      nodes: layout.nodes.map(node => ({
        ...node,
        data: { ...node.data, showAPP6Symbols }
      })),
      edges: layout.edges
    }
  }, [data, showAPP6Symbols, depthLimit, peopleFilter])

  return (
    <div style={{ height: "100vh", width: "100%", backgroundColor: "#f8fafc" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
        nodesDraggable={false}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          <div>
            <input
              type="checkbox"
              id="showAPP6Symbols"
              checked={showAPP6Symbols}
              onChange={toggleDisplayMode}
              style={{ cursor: "pointer", marginRight: "8px", outline: "none" }}
            />
            <label htmlFor="showAPP6Symbols">Display APP-6 symbols</label>
          </div>
          <button
            onClick={increaseDepthLimit}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            Increase Depth
          </button>
          <button
            onClick={decreaseDepthLimit}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            Decrease Depth
          </button>
          <select
            value={peopleFilter}
            onChange={e =>
              setPeopleFilter(e.target.value as PeopleFilterOption)}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            <option value="none">No positions</option>
            <option value="leaders">Leaders Only</option>
            <option value="deputies">Deputies Only</option>
            <option value="both">Leaders & Deputies</option>
          </select>
        </div>
      </ReactFlow>
    </div>
  )
}

const parseSvgStringToJSX = svgString => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, "image/svg+xml")
  const svgElement = doc.documentElement

  svgElement.setAttribute("width", "60px")

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: new XMLSerializer().serializeToString(svgElement)
      }}
    />
  )
}

const CustomNode = ({
  data: { organization, label, symbol, depth, people, showSymbol, hasChildren }
}) => (
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
          marginLeft: TEXT_GAP + TEXT_WIDTH,
          display: "flex",
          alignItems: depth === 1 ? "start" : "center",
          minWidth: AVATAR_WIDTH,
          height: NODE_HEIGHT
        }}
      >
        {showSymbol && symbol && parseSvgStringToJSX(symbol)}
        {!showSymbol && (
          <EntityAvatarDisplay
            avatar={organization.entityAvatar}
            defaultAvatar={Organization.relatedObjectType}
            width={AVATAR_WIDTH}
            height={AVATAR_WIDTH}
            style={{ backgroundColor: "#f8fafc" }}
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
          alignItems: depth === 1 ? "start" : "center"
        }}
      />
    </div>
    {people.length > 0 && (
      <div
        style={{
          paddingLeft:
            NODE_WIDTH / 2 - (!hasChildren && depth > 1 ? AVATAR_WIDTH / 2 : 0)
        }}
      >
        {people.map(person => (
          <div key={person.uuid} style={{ padding: "5px", whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%" }}>
            <LinkTo
              modelType="Person"
              model={person}
              showIcon={false}
            />
          </div>
        ))}
      </div>
    )}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ opacity: 0, top: NODE_HEIGHT / 2 }}
    />
    <Handle
      type="target"
      position={depth > 1 ? Position.Left : Position.Top}
      style={{
        opacity: 0,
        left: NODE_WIDTH / 2 - (depth > 1 ? AVATAR_WIDTH / 2 : 0)
      }}
    />
  </div>
)
const nodeTypes = { custom: CustomNode }

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
