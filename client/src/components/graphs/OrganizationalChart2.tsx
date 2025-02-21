import { gql } from "@apollo/client"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _xor from "lodash/xor"
import { connect } from "react-redux"
import ReactFlow, { Handle, Position } from "reactflow"
import "reactflow/dist/style.css"

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
  const AVATAR_WIDTH = 100
  const TEXT_GAP = 10
  const TEXT_WIDTH = 150
  const NODE_WIDTH = (AVATAR_WIDTH / 2 + TEXT_GAP + TEXT_WIDTH) * 2
  const NODE_HEIGHT = 60
  const VERTICAL_SPACING = 80
  const SECONDARY_VERTICAL_SPACING = 40
  const HORIZONTAL_SPACING = -TEXT_WIDTH + 20
  const LEVEL_INDENT = 40
  const ARROW_INDENT = 10
  const CustomNode = ({ data }) => (
    <div style={{
      display: "flex",
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    }}>
      <div style={{
          marginLeft: TEXT_GAP + TEXT_WIDTH,
          display: "flex",
          alignItems: "center",
          width: AVATAR_WIDTH,
          height: NODE_HEIGHT,
          border: `2px solid ${data.depth === 0 ? "#1e40af" : "#e5e7eb"}`,
          borderRadius: "8px"
        }}
      >
        {/* {showSymbols && data.symbol && parseSvgStringToJSX(data.symbol)} */}
      <div
        style={{
          width: TEXT_WIDTH,
          marginLeft: TEXT_GAP,
          paddingTop: "4px",
          display: "flex",
          alignItems: "center"
        }}
      >
        {data.label}
      </div>
      {data.depth === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ opacity: 0 }}
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
              left: TEXT_WIDTH + TEXT_GAP + ARROW_INDENT,
              bottom: ARROW_INDENT / 2
            }}
          />
        </>
      )}
    </div>
  )

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

    const currentNode = {
      id: node.uuid,
      data: {
        label: node.shortName,
        depth,
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
          childY = currentY + VERTICAL_SPACING + NODE_HEIGHT
        } else {
          childX = currentX + LEVEL_INDENT
          childY += SECONDARY_VERTICAL_SPACING + NODE_HEIGHT
        }

        const childLayout = calculateLayout(child, depth + 1, childX, childY)

        nodes = nodes.concat(childLayout.nodes)
        edges = edges.concat(childLayout.edges)

        edges.push({
          id: `edge-${node.uuid}-${child.uuid}`,
          source: node.uuid,
          target: child.uuid,
          type: "smoothstep",
        })
      })
    }
    return { nodes, edges }
  }

  const OrbatChart = ({ data }) => {
    if (!data) {
      return <p>Loading...</p>
    }

    const { nodes, edges } = calculateLayout(data)

    return (
      <div style={{ height: "100vh", width: "100%", backgroundColor: "#f8fafc" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={{ custom: CustomNode }}
        >
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
