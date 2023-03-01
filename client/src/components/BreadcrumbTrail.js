import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"

export const BreadcrumbTrail = ({
  ascendantObjects,
  leaf,
  modelType,
  parentField
}) => {
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
    if (trail.length) {
      trail.unshift(" » ")
    }
    trail.unshift(
      <LinkTo
        key={node.uuid}
        modelType={modelType}
        model={node}
        showIcon={false}
      />
    )
    uuid = node[parentField]?.uuid
  }
  return trail
}

BreadcrumbTrail.propTypes = {
  modelType: PropTypes.string.isRequired,
  leaf: PropTypes.object.isRequired,
  ascendantObjects: PropTypes.array,
  parentField: PropTypes.string.isRequired
}
