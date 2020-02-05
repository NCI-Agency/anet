import React from "react"
import { gql } from "apollo-boost"
import parse from "html-react-parser"
import API from "api"
import LinkAnet from "components/editor/LinkAnet"

const UUID_REGEX =
  "^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
    }
  }
`

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      role
      avatar(size: 32)
    }
  }
`

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
    }
  }
`

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      uuid
      name
    }
  }
`

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
    }
  }
`

const GQL_GET_TASK = gql`
  query($uuid: String!) {
    task(uuid: $uuid) {
      uuid
      shortName
      longName
    }
  }
`

export const ENTITY_TYPES = {
  REPORT: "Report",
  PERSON: "Person",
  ORGANIZATION: "Organization",
  POSITION: "Position",
  LOCATION: "Location",
  TASK: "Task"
}

const parsedEntityLinkType = {
  reports: ENTITY_TYPES.REPORT,
  people: ENTITY_TYPES.PERSON,
  organizations: ENTITY_TYPES.ORGANIZATION,
  positions: ENTITY_TYPES.POSITION,
  locations: ENTITY_TYPES.LOCATION,
  tasks: ENTITY_TYPES.TASK
}

const parsedEntityLinkTypeQuery = {
  [ENTITY_TYPES.REPORT]: GQL_GET_REPORT,
  [ENTITY_TYPES.PERSON]: GQL_GET_PERSON,
  [ENTITY_TYPES.ORGANIZATION]: GQL_GET_ORGANIZATION,
  [ENTITY_TYPES.POSITION]: GQL_GET_POSITION,
  [ENTITY_TYPES.LOCATION]: GQL_GET_LOCATION,
  [ENTITY_TYPES.TASK]: GQL_GET_TASK
}

export function getEntityInfoFromUrl(url) {
  const splittedUrl = url.split(/[\\/]/)

  if (splittedUrl.length > 1) {
    const typeRaw = splittedUrl[splittedUrl.length - 2]
    const uuid = splittedUrl[splittedUrl.length - 1]
    const type = parsedEntityLinkType[typeRaw]

    if (type && new RegExp(UUID_REGEX).test(uuid)) {
      return { type: type, uuid: uuid }
    } else {
      console.log(`Failed to parse entity type (${type}) or UUID (${uuid}).`)
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

export function getEntityByUuid(type, uuid) {
  const entityQuery = parsedEntityLinkTypeQuery[type]
  if (!entityQuery) {
    console.log(`Unsupported entity type: ${type}`)
    return
  }

  return API.query(entityQuery, {
    uuid: uuid
  }).then(data => {
    const entity =
      data.report ||
      data.person ||
      data.organization ||
      data.position ||
      data.location ||
      data.task
    if (entity) {
      return entity
    }
  })
}
