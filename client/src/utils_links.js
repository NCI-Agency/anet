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

const parsedEntityLinkTypeQuery = new Map([
  ["report", GQL_GET_REPORT],
  ["person", GQL_GET_PERSON],
  ["organization", GQL_GET_ORGANIZATION],
  ["position", GQL_GET_POSITION],
  ["anetLocation", GQL_GET_LOCATION],
  ["task", GQL_GET_TASK]
])

const parsedEntityLinkType = new Map([
  ["reports", "report"],
  ["people", "person"],
  ["organizations", "organization"],
  ["positions", "position"],
  ["locations", "anetLocation"],
  ["tasks", "task"]
])

export function getEntityInfoFromUrl(url) {
  const splittedUrl = url.split(/[\\//]/)

  if (splittedUrl.length > 1) {
    var type = splittedUrl[splittedUrl.length - 2]
    const uuid = splittedUrl[splittedUrl.length - 1]

    if (parsedEntityLinkType.has(type) && new RegExp(UUID_REGEX).test(uuid)) {
      type = parsedEntityLinkType.get(type)
      return { type, uuid }
    }
  }

  return null
}

// Enhanced HTML so that links will be converted to LinkTo components
export function enhanceHtml(html, report) {
  return parse(html, {
    replace: domNode => {
      if (domNode.attribs && domNode.attribs.href) {
        return <LinkAnet url={domNode.attribs.href} />
      }
    }
  })
}

export function getEntityByUuid(type, uuid) {
  const query = parsedEntityLinkTypeQuery.get(type)
  return API.query(query, {
    uuid: uuid
  }).then(data => {
    const entity = data.report || data.person || data.organization || data.position || data.location || data.task
    if (entity) {
      return entity
    }
  })
}
