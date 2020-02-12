import React from "react"
import { gql } from "apollo-boost"
import parse from "html-react-parser"
import API from "api"
import LinkAnet from "components/editor/LinkAnet"

const UUID_REGEX =
  "^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    entity: report(uuid: $uuid) {
      uuid
      intent
    }
  }
`

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    entity: person(uuid: $uuid) {
      uuid
      name
      role
      avatar(size: 32)
    }
  }
`

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    entity: organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    entity: position(uuid: $uuid) {
      uuid
      name
    }
  }
`

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    entity: location(uuid: $uuid) {
      uuid
      name
    }
  }
`

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    entity: task(uuid: $uuid) {
      uuid
      shortName
      longName
    }
  }
`

export const ENTITY_TYPES = {
  REPORTS: "Report",
  PEOPLE: "Person",
  ORGANIZATIONS: "Organization",
  POSITIONS: "Position",
  LOCATIONS: "Location",
  TASKS: "Task"
}

const parsedEntityLinkType = {
  reports: ENTITY_TYPES.REPORTS,
  people: ENTITY_TYPES.PEOPLE,
  organizations: ENTITY_TYPES.ORGANIZATIONS,
  positions: ENTITY_TYPES.POSITIONS,
  locations: ENTITY_TYPES.LOCATIONS,
  tasks: ENTITY_TYPES.TASKS
}

const parsedEntityLinkTypeQuery = {
  [ENTITY_TYPES.REPORTS]: GQL_GET_REPORT,
  [ENTITY_TYPES.PEOPLE]: GQL_GET_PERSON,
  [ENTITY_TYPES.ORGANIZATIONS]: GQL_GET_ORGANIZATION,
  [ENTITY_TYPES.POSITIONS]: GQL_GET_POSITION,
  [ENTITY_TYPES.LOCATIONS]: GQL_GET_LOCATION,
  [ENTITY_TYPES.TASKS]: GQL_GET_TASK
}

export function getEntityInfoFromUrl(url) {
  const splittedUrl = url.split(/[\\/]/)

  if (splittedUrl.length > 1) {
    const typeRaw = splittedUrl[splittedUrl.length - 2]
    const uuid = splittedUrl[splittedUrl.length - 1]
    const type = parsedEntityLinkType[typeRaw]

    if (type && new RegExp(UUID_REGEX).test(uuid)) {
      return { type: type, uuid: uuid }
    }
  }

  return null
}

// Enhanced HTML so that links will be converted to LinkTo components
export function parseHtmlWithLinkTo(html, report) {
  return parse(html, {
    replace: domNode => {
      if (domNode.attribs && domNode.attribs.href) {
        return <LinkAnet url={domNode.attribs.href} />
      }
    }
  })
}

// If entity could not retrieved a null will be returned
export function getEntityByUuid(type, uuid) {
  const entityQuery = parsedEntityLinkTypeQuery[type]
  if (!entityQuery) {
    return null
  }

  return API.query(entityQuery, {
    uuid: uuid
  }).then(data => data.entity)
}
