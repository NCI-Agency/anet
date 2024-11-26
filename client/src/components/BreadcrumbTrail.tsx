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
  style?: any
}

export const BreadcrumbTrail = ({
  modelType,
  leaf,
  ascendantObjects,
  parentField,
  isLink,
  style
}: BreadcrumbTrailProps) => {
  const trail = utils.getAscendantObjectsAsList(
    leaf,
    ascendantObjects,
    parentField
  )
  return (
    <span>
      {trail.map((node, i) => (
        <React.Fragment key={node.uuid}>
          {i > 0 && " » "}
          <LinkTo
            modelType={modelType}
            model={node}
            showIcon={false}
            isLink={isLink}
            style={style}
          />
        </React.Fragment>
      ))}
    </span>
  )
}
