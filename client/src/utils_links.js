import * as Models from "models"
import { PAGE_URLS } from "pages/util"

export const ANET_LINK = "anet-link"
export const EXTERNAL_LINK = "external-link"
export const LINK_TYPES = [ANET_LINK, EXTERNAL_LINK]

const UUID_REGEX =
  "^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$"

// Entity type --> entity name
export const ENTITY_TYPES = {
  REPORTS: Models.Report.resourceName,
  PEOPLE: Models.Person.resourceName,
  ORGANIZATIONS: Models.Organization.resourceName,
  POSITIONS: Models.Position.resourceName,
  LOCATIONS: Models.Location.resourceName,
  TASKS: Models.Task.resourceName
}

// Entity URL --> Entity type
const ENTITY_URL_TYPES = {
  [PAGE_URLS.REPORTS]: ENTITY_TYPES.REPORTS,
  [PAGE_URLS.PEOPLE]: ENTITY_TYPES.PEOPLE,
  [PAGE_URLS.ORGANIZATIONS]: ENTITY_TYPES.ORGANIZATIONS,
  [PAGE_URLS.POSITIONS]: ENTITY_TYPES.POSITIONS,
  [PAGE_URLS.LOCATIONS]: ENTITY_TYPES.LOCATIONS,
  [PAGE_URLS.TASKS]: ENTITY_TYPES.TASKS
}
// Entity type --> Entity URL
const ENTITY_TYPE_URLS = {
  [ENTITY_TYPES.REPORTS]: PAGE_URLS.REPORTS,
  [ENTITY_TYPES.PEOPLE]: PAGE_URLS.PEOPLE,
  [ENTITY_TYPES.ORGANIZATIONS]: PAGE_URLS.ORGANIZATIONS,
  [ENTITY_TYPES.POSITIONS]: PAGE_URLS.POSITIONS,
  [ENTITY_TYPES.LOCATIONS]: PAGE_URLS.LOCATIONS,
  [ENTITY_TYPES.TASKS]: PAGE_URLS.TASKS
}

export function getEntityInfoFromUrl(url) {
  const splittedUrl = url.split(/[\\/]/)

  if (splittedUrl.length > 1) {
    const typeRaw = "/" + splittedUrl[splittedUrl.length - 2]
    const entityType = ENTITY_URL_TYPES[typeRaw]
    const entityUuid = splittedUrl[splittedUrl.length - 1]

    if (entityType && new RegExp(UUID_REGEX).test(entityUuid)) {
      return { type: ANET_LINK, entityType, entityUuid }
    } else {
      return { type: EXTERNAL_LINK, url }
    }
  }

  return null
}

export function getUrlFromEntityInfo(node) {
  const { url, entityType, entityUuid } = node
  if (url) {
    return url
  }
  const baseUrl = window.location.origin
  const type = ENTITY_TYPE_URLS[entityType]
  return `${baseUrl}${type}/${entityUuid}`
}
