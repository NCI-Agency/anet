import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_FIELDS } from "components/Model"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"

const LinkAnetEntity = ({ type, uuid, displayCallback, children }) => {
  const [entity, setEntity] = useState()
  const [whenNotFound, setWhenNotFound] = useState(null)

  useEffect(() => {
    let mounted = true
    const modelClass = Models[type]
    modelClass
      ?.fetchByUuid(uuid, GRAPHQL_ENTITY_FIELDS)
      .then(data => {
        if (mounted) {
          setEntity(data)
          setWhenNotFound(null)
        }
      })
      .catch(() => {
        if (mounted) {
          setEntity({ uuid })
          setWhenNotFound(
            <em>
              [{type} with uuid {uuid} not found]
            </em>
          )
        }
      })
    return () => {
      mounted = false
    }
  }, [type, uuid])

  return (
    <LinkTo modelType={type} model={entity} displayCallback={displayCallback}>
      {whenNotFound || children}
    </LinkTo>
  )
}

LinkAnetEntity.propTypes = {
  type: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  displayCallback: PropTypes.func,
  children: PropTypes.node
}

LinkAnetEntity.defaultProps = {
  displayCallback: null
}

export default LinkAnetEntity
