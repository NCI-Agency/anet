import LinkTo from "components/LinkTo"
import React from "react"
import utils from "utils"

export const getBreadcrumbTrailAsText = (
  leaf,
  ascendantObjects,
  parentField,
  labelField
) => {
  const trail = utils.getAscendantObjectsAsList(
    leaf,
    ascendantObjects,
    parentField
  )
  return trail.map(node => node[labelField]).join(" » ")
}

interface BreadcrumbTrailProps {
  modelType: string
  leaf: any
  ascendantObjects?: any[]
  parentField: string
  isLink?: boolean
  hideParents?: boolean
  lastParentTask?: any
  style?: any
}

export const BreadcrumbTrail = ({
  modelType,
  leaf,
  ascendantObjects,
  parentField,
  isLink,
  hideParents,
  lastParentTask,
  style
}: BreadcrumbTrailProps) => {
  const trail = utils.getAscendantObjectsAsList(
    leaf,
    ascendantObjects,
    parentField
  )
  if (hideParents && lastParentTask) {
    // if hideParents is true, we remove all tasks up until the last parent task
    const lastParentTaskIndex =
      trail.findIndex(node => node.uuid === lastParentTask.uuid) || 0
    trail.splice(0, Math.min(trail.length - 1, lastParentTaskIndex + 1))
  } else if (lastParentTask && lastParentTask.uuid === leaf.uuid) {
    // if lastParentTask is the same as leaf, we remove everything before it
    trail.splice(0, trail.length - 1)
  }
  return (
    <span>
      {trail.map((node, i) => (
        <React.Fragment key={node.uuid}>
          {(i > 0 || hideParents) && (
            <div
              style={{
                display: "inline-block",
                marginLeft: 10,
                marginRight: 10,
                width: 7
              }}
            >
              {" "}
              »{" "}
            </div>
          )}
          <LinkTo
            modelType={modelType}
            model={node}
            showIcon={i === 0 && !hideParents}
            isLink={isLink}
            style={style}
          />
        </React.Fragment>
      ))}
    </span>
  )
}
