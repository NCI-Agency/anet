import { gql } from "@apollo/client"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import React, { useState, useMemo } from "react"
import _xor from "lodash/xor"
import ms from "milsymbol"
import { connect } from "react-redux"
import ReactFlow, { Handle, Position, ReactFlowProvider, useReactFlow } from "reactflow"
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
    }
  }
`

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

  const parseSvgStringToJSX = (svgString) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, "image/svg+xml")
    const svgElement = doc.documentElement

    svgElement.setAttribute("width", "60px")

    return (
      <span dangerouslySetInnerHTML={{ __html: new XMLSerializer().serializeToString(svgElement) }} />
    )
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
    const version = "14" // APP-6E
    const status = "0" // Present
    return new ms.Symbol(
      `${version}${context}${standardIdentity}${symbolSet}${status}${hq}${amplifier}`,
      {
        size: 22
      }
    )
  }

  const AVATAR_WIDTH = 60
  const TEXT_GAP = 10
  const TEXT_WIDTH = 150
  const NODE_WIDTH = (AVATAR_WIDTH / 2 + TEXT_GAP + TEXT_WIDTH) * 2
  const NODE_HEIGHT = 60
  const VERTICAL_SPACING = 80
  const SECONDARY_VERTICAL_SPACING = 40
  const HORIZONTAL_SPACING = -TEXT_WIDTH + 20
  const LEVEL_INDENT = 60
  let lowestDepth = 0

  const calculateLayout = (node, depth = 0, x = 0, y = 0) => {
    if (!node) {
      return { nodes: [], edges: [] }
    }

    const isRoot = depth === 0
    let currentX = x
    let currentY = y
    const children = node.descendantOrgs || []

    if (isRoot) {
      currentX = 0
      currentY = 0
    }

    const allAscendantOrgs = utils.getAscendantObjectsAsMap(
      (node.ascendantOrgs ?? []).concat(
        node.descendantOrgs ?? []
      )
    )

    const currentNode = {
      id: node.uuid,
      data: {
        label: node.shortName,
        depth,
        symbol: determineSymbol(node, allAscendantOrgs).asSVG()
      },
      position: { x: currentX, y: currentY },
      type: "custom"
    }

    let nodes = [currentNode]
    let edges = []
    let childY =
      currentY + VERTICAL_SPACING - SECONDARY_VERTICAL_SPACING - NODE_HEIGHT

    if (children.length > 0) {
      let childStartX = currentX

      if (isRoot) {
        const totalWidth =
          children.length * NODE_WIDTH +
          (children.length - 1) * HORIZONTAL_SPACING
        childStartX = -totalWidth / 2 + NODE_WIDTH / 2
      }

      let childX = childStartX - NODE_WIDTH - HORIZONTAL_SPACING
      children.forEach((child) => {
        if (isRoot) {
          childX += NODE_WIDTH + HORIZONTAL_SPACING
          if (lowestDepth > 1) {
            childX += (lowestDepth - 2) * LEVEL_INDENT
          }
          childY = currentY + VERTICAL_SPACING + NODE_HEIGHT
          lowestDepth = 0
        } else {
          childX = currentX + LEVEL_INDENT
          childY += SECONDARY_VERTICAL_SPACING + NODE_HEIGHT
        }

        const childLayout = calculateLayout(child, depth + 1, childX, childY)
        if (childLayout.nodes.slice(-1).length) {
          childY =
            childLayout.nodes.slice(-1)[0].position.y -
            SECONDARY_VERTICAL_SPACING / 2
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
      })
    }
    if (depth > lowestDepth) {
      lowestDepth = depth
    }
    if (isRoot) {
      let lowestX = nodes[0].position.x
      let highestX = lowestX
      nodes.forEach(({ position }) => {
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

  const OrbatChart = ({ data }) => (
    <ReactFlowProvider>
      <OrbatChartWrapper data={data} />
    </ReactFlowProvider>
  )

  const OrbatChartWrapper = ({ data }) => {
    const [showSymbols, setShowSymbols] = useState(true)
    const { setViewport, getViewport } = useReactFlow()

    const { nodes, edges } = useMemo(() => {
      if (!data) return { nodes: [], edges: [] }
      
      const layout = calculateLayout(data)
      return {
        nodes: layout.nodes.map(node => ({
          ...node,
          data: { ...node.data, showSymbols }
        })),
        edges: layout.edges
      }
    }, [data, showSymbols])

    const CustomNode = ({ data }) => (
      <div style={{
        display: "flex",
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      }}>
        <div style={{
            marginLeft: TEXT_GAP + TEXT_WIDTH,
            display: "flex",
            alignItems: "start",
            width: AVATAR_WIDTH,
            height: NODE_HEIGHT,
          }}
        >
          {showSymbols && data.symbol && parseSvgStringToJSX(data.symbol)}
        </div>
  
        <div
          style={{
            width: TEXT_WIDTH,
            marginLeft: TEXT_GAP,
            paddingTop: "4px",
            display: "flex",
            alignItems: "start"
          }}
        >
          {data.label}
        </div>
        {data.depth === 0 && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ opacity: 0, top: NODE_HEIGHT / 2 }}
          />
        )}
        {data.depth === 1 && (
          <>
            <Handle
              type="target"
              position={Position.Top}
              style={{ opacity: 0 }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              style={{
                opacity: 0,
                top: NODE_HEIGHT / 2
              }}
            />
          </>
        )}
        {data.depth >= 2 && (
          <>
            <Handle
              type="target"
              position={Position.Left}
              style={{
                opacity: 0,
                left: NODE_WIDTH / 2 - AVATAR_WIDTH / 2
              }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              style={{
                opacity: 0,
                top: NODE_HEIGHT / 2,
                left: NODE_WIDTH / 2
              }}
            />
          </>
        )}
      </div>
    )
    
    const toggleDisplayMode = () => {
      setShowSymbols(prev => !prev)
      setTimeout(() => setViewport(getViewport()), 0)
    }

    if (!data) {
      return <p>Loading...</p>
    }

    return (
      <div style={{ height: "100vh", width: "100%", backgroundColor: "#f8fafc" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={{ custom: CustomNode }}
          nodesDraggable={false}
          elementsSelectable={false}
        >
          <button
            onClick={toggleDisplayMode}
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              zIndex: 10,
              padding: "8px 16px",
              backgroundColor: "grey",
              cursor: "pointer"
            }}
          >
            {showSymbols ? "Show Avatars" : "Show Symbols"}
          </button>
        </ReactFlow>
      </div>
    )
  }

  const OrganizationalChart = ({ organizationData }) => {
    if (!organizationData || !organizationData.organization) {
      return <p>Loading...</p>
    }

    return <OrbatChart data={organizationData.organization} />
  }

  if (done) {
    return result
  }

  return <OrganizationalChart organizationData={data} />
}

export default connect(null, mapPageDispatchersToProps)(OrganizationalChart)
