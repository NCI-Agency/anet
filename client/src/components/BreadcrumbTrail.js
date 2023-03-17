import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"

const getBreadcrumbTrail = (leaf, ascendantObjects, parentField) => {
  const parentMap =
    ascendantObjects?.reduce((acc, val) => {
      acc[val.uuid] = val
      return acc
    }, {}) || {}
  parentMap[leaf.uuid] = leaf
  let uuid = leaf.uuid
  const trail = []
  while (uuid) {
    const node = parentMap[uuid]
    if (!node) {
      break
    }
    trail.unshift(node)
    uuid = node[parentField]?.uuid
  }
  return trail
}

export const getBreadcrumbTrailAsText = (
  leaf,
  ascendantObjects,
  parentField,
  labelField
) => {
  const trail = getBreadcrumbTrail(leaf, ascendantObjects, parentField)
  return trail.map(node => node[labelField]).join(" » ")
}

export const BreadcrumbTrail = ({
  modelType,
  leaf,
  ascendantObjects,
  parentField,
  isLink,
  style
}) => {
  const trail = getBreadcrumbTrail(leaf, ascendantObjects, parentField)
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

BreadcrumbTrail.propTypes = {
  modelType: PropTypes.string.isRequired,
  leaf: PropTypes.object.isRequired,
  ascendantObjects: PropTypes.array,
  parentField: PropTypes.string.isRequired,
  isLink: PropTypes.bool,
  style: PropTypes.object
}
