import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { getEntityByUuid } from "utils_links"

const LinkAnetEntity = ({ type, uuid, children }) => {
  const [entity, setEntity] = useState()

  useEffect(() => {
    const response = getEntityByUuid(type, uuid)
    if (response) {
      response.then(data => setEntity(data))
    }
  }, [type, uuid])

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
