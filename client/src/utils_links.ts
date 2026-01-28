import * as Models from "models"

export const ANET_LINK = "anet-link"
export const EXTERNAL_LINK = "external-link"
export const LINK_TYPES = [ANET_LINK, EXTERNAL_LINK]

const UUID_REGEX =
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

export const RELATED_OBJECT_TYPE_TO_ENTITY_TYPE = {
  [Models.Report.relatedObjectType]: Models.Report.resourceName,
  [Models.Person.relatedObjectType]: Models.Person.resourceName,
  [Models.Organization.relatedObjectType]: Models.Organization.resourceName,
  [Models.Position.relatedObjectType]: Models.Position.resourceName,
  [Models.Location.relatedObjectType]: Models.Location.resourceName,
  [Models.Task.relatedObjectType]: Models.Task.resourceName,
  // For matching the old URL …/authorizationGroups/<uuid>
  [Models.AuthorizationGroup.relatedObjectType]:
    Models.AuthorizationGroup.resourceName,
  // For matching the new URL …/communities/<uuid>
  communities: Models.AuthorizationGroup.resourceName,
  [Models.Attachment.relatedObjectType]: Models.Attachment.resourceName,
  [Models.Event.relatedObjectType]: Models.Event.resourceName,
  [Models.EventSeries.relatedObjectType]: Models.EventSeries.resourceName
}

const flip = data =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]))

const ENTITY_TYPE_TO_RELATED_OBJECT_TYPE = flip(
  RELATED_OBJECT_TYPE_TO_ENTITY_TYPE
)

export function getEntityInfoFromUrl(url) {
  const urlObject = new URL(url, window.location.href)
  if (urlObject.protocol === "urn:") {
    return getEntityFromUrlPattern(
      url,
      urlObject.pathname,
      /^anet:([^:]*):(.*)$/
    )
  }
  if (urlObject.host === window.location.host) {
    return getEntityFromUrlPattern(url, urlObject.pathname, /^\/([^/]*)\/(.*)$/)
  }
  return { type: EXTERNAL_LINK, url }
}

function getEntityFromUrlPattern(url, urlPath, entityPattern) {
  const entityMatch = urlPath.match(entityPattern)
  const entityType = RELATED_OBJECT_TYPE_TO_ENTITY_TYPE[entityMatch?.[1]]
  const entityUuid = entityMatch?.[2]
  if (entityType && UUID_REGEX.test(entityUuid)) {
    return { type: ANET_LINK, entityType, entityUuid }
  } else {
    return { type: EXTERNAL_LINK, url }
  }
}

export function getUrlFromEntityInfo(node) {
  const { url, entityType, entityUuid } = node
  return (
    url ||
    `urn:anet:${ENTITY_TYPE_TO_RELATED_OBJECT_TYPE[entityType]}:${entityUuid}`
  )
}

export function getAttachmentUuidsFromRichText(richText = "") {
  return new Set(
    richText
      .matchAll(
        new RegExp(
          `<a href="urn:anet:${Models.Attachment.relatedObjectType}:([^"]*)"`,
          "g"
        )
      )
      .map(match => match?.[1])
      .filter(uuid => UUID_REGEX.test(uuid))
  )
}
