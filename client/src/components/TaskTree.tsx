import { MaybeElement, Tree, TreeNodeInfo } from "@blueprintjs/core"
import { IconNames, type IconName } from "@blueprintjs/icons"
import LinkTo from "components/LinkTo"
import cloneDeep from "lodash/cloneDeep"
import React, { useCallback, useReducer } from "react"
import utils from "utils"

type NodePath = number[]

type TreeAction = {
  type: "SET_IS_EXPANDED"
  payload: {
    path: NodePath
    isExpanded: boolean
    icon: IconName | MaybeElement
  }
}

function treeReducer(state: TreeNodeInfo[], action: TreeAction) {
  if (action.type === "SET_IS_EXPANDED") {
    const newState = cloneDeep(state)
    const node = Tree.nodeFromPath(action.payload.path, newState)
    node.icon = action.payload.icon
    node.isExpanded = action.payload.isExpanded
    return newState
  }
  return state
}

function createTreeNode(task, taskMap, nodeMap) {
  if (!task || !taskMap[task.uuid] || nodeMap[task.uuid]) {
    // No task, task not present, or task node already in tree
    return
  }
  if (taskMap[task.parentTask?.uuid] && !nodeMap[task.parentTask?.uuid]) {
    // Parent task node not yet in tree
    createTreeNode(taskMap[task.parentTask?.uuid], taskMap, nodeMap)
  }
  // Create node
  const node: TreeNodeInfo = {
    id: task.uuid,
    label: (
      <LinkTo modelType="Task" model={task}>
        {[task.shortName, task.longName].filter(Boolean).join(" | ")}
      </LinkTo>
    ),
    icon: IconNames.DOCUMENT
  }
  nodeMap[task.uuid] = node
  const parentNode = nodeMap[task.parentTask?.uuid]
  if (parentNode) {
    // Link to parent node
    if (!parentNode.childNodes) {
      parentNode.childNodes = []
    }
    parentNode.icon = IconNames.FOLDER_CLOSE
    parentNode.isExpanded = false
    parentNode.childNodes.push(node)
  }
  return node
}

function createTreeNodes(tasks: any[]): TreeNodeInfo[] {
  // Build taskMap
  let taskMap = {}
  tasks.forEach((task: any) => {
    taskMap = {
      ...taskMap,
      ...utils.getAscendantObjectsAsMap(task.descendantTasks)
    }
    taskMap[task.uuid] = task
  })

  // Build nodeMap and gather rootNodes
  const nodeMap = {}
  const rootNodes = []
  tasks.forEach((task: any) => {
    createTreeNode(task, taskMap, nodeMap)
    task.descendantTasks.forEach((t: any) =>
      createTreeNode(t, taskMap, nodeMap)
    )
    if (!taskMap[task.parentTask?.uuid]) {
      // Top-level task
      rootNodes.push(nodeMap[task.uuid])
    }
  })
  return rootNodes
}

interface TaskTreeProps {
  tasks: any[]
}

const TaskTree = ({ tasks }: TaskTreeProps) => {
  const [nodes, dispatch] = useReducer(treeReducer, createTreeNodes(tasks))

  const handleNodeCollapse = useCallback(
    (_node: TreeNodeInfo, nodePath: NodePath) => {
      dispatch({
        payload: {
          path: nodePath,
          isExpanded: false,
          icon: IconNames.FOLDER_CLOSE
        },
        type: "SET_IS_EXPANDED"
      })
    },
    []
  )

  const handleNodeExpand = useCallback(
    (_node: TreeNodeInfo, nodePath: NodePath) => {
      dispatch({
        payload: {
          path: nodePath,
          isExpanded: true,
          icon: IconNames.FOLDER_OPEN
        },
        type: "SET_IS_EXPANDED"
      })
    },
    []
  )

  return (
    <Tree
      contents={nodes}
      onNodeCollapse={handleNodeCollapse}
      onNodeExpand={handleNodeExpand}
    />
  )
}

export default TaskTree
