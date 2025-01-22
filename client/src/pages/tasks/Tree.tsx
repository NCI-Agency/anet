import { gql } from "@apollo/client"
import { Tree } from "@blueprintjs/core"
import API from "api"
import LinkTo from "components/LinkTo"
import React, { useState } from "react"

const GQL_GET_DESCENDANT_TASKS = gql`
  query ($taskUuid: String!) {
    task(uuid: $taskUuid) {
      uuid
      shortName
      longName
      descendantTasks {
        uuid
        shortName
        longName
        parentTask {
          uuid
        }
        descendantTasks {
          uuid
        }
      }
    }
  }
`

interface Task {
  uuid: string
  shortName: string
  longName?: string
  descendantTasks?: Task[]
}

interface TaskTreeProps {
  tasks: Task[]
}

const createTaskNode = (task: Task) => ({
  id: task.uuid,
  label: (
    <div>
      <LinkTo showIcon={false} modelType="Task" model={task}>
        <span>
          {task.shortName}
          {task.longName && `: ${task.longName}`}
        </span>
      </LinkTo>
    </div>
  ),
  isExpanded: false,
  hasCaret: !!task.descendantTasks?.length,
  childNodes: [],
  icon: "target"
})

const TaskTree: React.FC<TaskTreeProps> = ({ tasks }) => {
  const [nodes, setNodes] = useState(() =>
    tasks.map(task => createTaskNode(task))
  )

  const fetchDescendantTasks = async(nodeId: string) => {
    try {
      const { data } = await API.client.query({
        query: GQL_GET_DESCENDANT_TASKS,
        variables: { taskUuid: nodeId }
      })
      if (data?.task?.descendantTasks) {
        const filteredTasks = data.task.descendantTasks.filter(
          (task: Task) => task.parentTask?.uuid === data.task.uuid
        )
        return filteredTasks.map((descendant: Task) =>
          createTaskNode(descendant)
        )
      }
    } catch {
      return []
    }
  }

  const updateNodeChildren = async(parentNode: any, childNodes: any[]) => {
    const recursiveUpdate = (nodeList: any[]) =>
      nodeList.map(node => {
        if (node.id === parentNode.id) {
          return {
            ...node,
            isExpanded: true,
            childNodes
          }
        }
        if (node.childNodes.length > 0) {
          return {
            ...node,
            childNodes: recursiveUpdate(node.childNodes)
          }
        }
        return node
      })

    setNodes(prevNodes => recursiveUpdate(prevNodes))
  }

  const handleNodeExpand = async(node: any) => {
    if (node.childNodes.length === 0) {
      const descendants = await fetchDescendantTasks(node.id)
      await updateNodeChildren(node, descendants)
    } else {
      const recursiveExpand = (nodeList: any[]) =>
        nodeList.map(n =>
          n.id === node.id
            ? { ...n, isExpanded: true }
            : { ...n, childNodes: recursiveExpand(n.childNodes) }
        )

      setNodes(prevNodes => recursiveExpand(prevNodes))
    }
  }

  const handleNodeCollapse = (node: any) => {
    const recursiveCollapse = (nodeList: any[]) =>
      nodeList.map(n =>
        n.id === node.id
          ? { ...n, isExpanded: false }
          : { ...n, childNodes: recursiveCollapse(n.childNodes) }
      )

    setNodes(prevNodes => recursiveCollapse(prevNodes))
  }

  return (
    <Tree
      contents={nodes}
      onNodeExpand={nodeData => handleNodeExpand(nodeData)}
      onNodeCollapse={nodeData => handleNodeCollapse(nodeData)}
    />
  )
}

export default TaskTree
