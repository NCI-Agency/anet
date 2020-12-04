import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_FIELDS } from "components/Model"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

const LinkAnetEntity = ({ type, uuid, children }) => {
  const [entity, setEntity] = useState()

  useEffect(() => {
    let mounted = true
    const modelClass = Models[type]
    modelClass &&
      modelClass
        .fetchByUuid(uuid, GRAPHQL_ENTITY_FIELDS)
        .then(data => mounted && setEntity(data))
    return () => {
      mounted = false
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
