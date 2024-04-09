import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
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

export const BreadcrumbTrail = ({
  modelType,
  leaf,
  ascendantObjects,
  parentField,
  isLink,
  style
}) => {
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

BreadcrumbTrail.propTypes = {
  modelType: PropTypes.string.isRequired,
  leaf: PropTypes.object.isRequired,
  ascendantObjects: PropTypes.array,
  parentField: PropTypes.string.isRequired,
  isLink: PropTypes.bool,
  style: PropTypes.object
}
