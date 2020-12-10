import * as Models from "models"
import { PAGE_URLS } from "pages/util"

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

export function getEntityInfoFromUrl(url) {
  const splittedUrl = url.split(/[\\/]/)

  if (splittedUrl.length > 1) {
    const typeRaw = "/" + splittedUrl[splittedUrl.length - 2]
    const uuid = splittedUrl[splittedUrl.length - 1]
    const type = ENTITY_URL_TYPES[typeRaw]

    if (type && new RegExp(UUID_REGEX).test(uuid)) {
      return { type: type, uuid: uuid }
    }
  }

  return null
}
