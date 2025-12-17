import LinkTo from "components/LinkTo"
import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import React from "react"

interface RelatedObjectDisplayProps {
  relatedObjectType?: string
  relatedObjectUuid?: string
  relatedObject?: any
  specialModels?: object
}

export const RelatedObjectDisplay = ({
  relatedObjectType,
  relatedObjectUuid,
  relatedObject,
  specialModels
}: RelatedObjectDisplayProps) => {
  const model = OBJECT_TYPE_TO_MODEL[relatedObjectType]
  return model ? (
    <LinkTo
      modelType={relatedObjectType}
      model={{
        uuid: relatedObjectUuid,
        ...relatedObject
      }}
    >
      {!relatedObject && `[deleted ${model}::${relatedObjectUuid}]`}
    </LinkTo>
  ) : (
    (specialModels?.[relatedObjectType] ??
      `entity ${relatedObjectType}::${relatedObjectUuid}`)
  )
}
