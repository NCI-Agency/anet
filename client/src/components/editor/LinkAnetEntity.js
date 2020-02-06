import PropTypes from "prop-types"
import React, { useState, useEffect } from "react"
import LinkTo from "components/LinkTo"
import { getEntityByUuid } from "utils_links"

const LinkAnetEntity = ({ type, uuid, children }) => {
  const [entity, setEntity] = useState()

  useEffect(() => {
    getEntityByUuid(type, uuid).then(data => setEntity(data))
  }, [type, uuid])

  // TODO: What if entity is null
  return (
    <LinkTo modelType={type} model={entity}>
      {children}
    </LinkTo>
  )
}

LinkAnetEntity.propTypes = {
  type: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  children: PropTypes.any
}

export default LinkAnetEntity
