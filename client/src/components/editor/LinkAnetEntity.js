import { GRAPHQL_ENTITY_FIELDS } from "components/Model"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

const LinkAnetEntity = ({
  type,
  uuid,
  linkToComp: LinkToComp,
  children,
  previewId
}) => {
  const [entity, setEntity] = useState()

  useEffect(() => {
    const modelClass = Models[type]
    modelClass &&
      modelClass
        .fetchByUuid(uuid, GRAPHQL_ENTITY_FIELDS)
        .then(data => setEntity(data))
  }, [type, uuid])

  return (
    <LinkToComp modelType={type} model={entity} previewId={previewId}>
      {children}
    </LinkToComp>
  )
}

LinkAnetEntity.propTypes = {
  type: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  linkToComp: PropTypes.func.isRequired,
  previewId: PropTypes.string,
  children: PropTypes.any
}

export default LinkAnetEntity
