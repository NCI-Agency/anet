import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import LinkTo from "components/LinkTo"
import * as Models from "models"
import React, { useEffect, useState } from "react"

interface LinkAnetEntityProps {
  type: string
  uuid: string
  displayCallback?: (...args: unknown[]) => unknown
  children?: React.ReactNode
  showAvatar?: boolean
}

const LinkAnetEntity = ({
  type,
  uuid,
  displayCallback = null,
  children = null,
  showAvatar = true
}: LinkAnetEntityProps) => {
  const [entity, setEntity] = useState()
  const [whenNotFound, setWhenNotFound] = useState(null)

  useEffect(() => {
    let mounted = true
    const modelClass = Models[type]
    modelClass
      ?.fetchByUuid(uuid, gqlEntityFieldsMap)
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
    <LinkTo
      modelType={type}
      model={entity}
      showAvatar={showAvatar}
      displayCallback={displayCallback}
    >
      {whenNotFound || children}
    </LinkTo>
  )
}

export default LinkAnetEntity
