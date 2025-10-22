import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
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
  ascendantTaskUuids?: Set<string>
  style?: any
}

export const BreadcrumbTrail = ({
  modelType,
  leaf,
  ascendantObjects,
  parentField,
  isLink,
  hideParents,
  ascendantTaskUuids,
  style
}: BreadcrumbTrailProps) => {
  const trail = utils.getAscendantObjectsAsList(
    leaf,
    ascendantObjects,
    parentField
  )
  let Component: React.ElementType
  let componentProps: object
  if (_isEmpty(ascendantTaskUuids)) {
    Component = React.Fragment
    componentProps = {}
  } else {
    Component = "div"
    componentProps = { className: "d-flex" }
    if (hideParents) {
      // if hideParents is true, we remove all tasks up until the last parent task
      const ascendantTaskIndex =
        trail.findLastIndex(node => ascendantTaskUuids.has(node.uuid)) || 0
      trail.splice(0, Math.min(trail.length - 1, ascendantTaskIndex + 1))
    } else if (
      ascendantTaskUuids.size === 1 &&
      ascendantTaskUuids.has(leaf.uuid)
    ) {
      // if the single ascendantTask is the same as leaf, we remove everything before it
      trail.splice(0, trail.length - 1)
    }
  }
  return (
    <span>
      {trail.map((node, i) => (
        <Component key={node.uuid} {...componentProps}>
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
        </Component>
      ))}
    </span>
  )
}
