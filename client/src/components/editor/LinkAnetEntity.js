import LinkTo from "components/LinkTo"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

// Entity type --> GQL query
const ENTITY_GQL_FIELDS = {
  Report: "uuid, intent",
  Person: "uuid, name, role, avatar(size: 32)",
  Organization: "uuid, shortName",
  Position: "uuid, name",
  Location: "uuid, name",
  Task: "uuid, shortName, longName"
}

const LinkAnetEntity = ({ type, uuid, children }) => {
  const [entity, setEntity] = useState()

  useEffect(() => {
    const modelClass = Models[type]
    modelClass &&
      modelClass
        .fetchByUuid(uuid, ENTITY_GQL_FIELDS)
        .then(data => setEntity(data))
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
