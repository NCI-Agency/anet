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

export const parsedEntityLinkType = new Map([
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
  switch (type) {
    case "report":
      return getReportByUuid(uuid)
    case "person":
      return getPersonByUuid(uuid)
    case "organization":
      return getOrganizationByUuid(uuid)
    case "position":
      return getPositionByUuid(uuid)
    case "anetLocation":
      return getLocationByUuid(uuid)
    case "task":
      return getTaskByUuid(uuid)
    default:
      console.log("Unknown entity type: " + type)
      return null
  }
}

export function getReportByUuid(uuid) {
  return API.query(GQL_GET_REPORT, {
    uuid: uuid
  }).then(data => {
    if (data.report) {
      return data.report
    }
  })
}

export function getPersonByUuid(uuid) {
  return API.query(GQL_GET_PERSON, {
    uuid: uuid
  }).then(data => {
    if (data.person) {
      return data.person
    }
  })
}

export function getOrganizationByUuid(uuid) {
  return API.query(GQL_GET_ORGANIZATION, {
    uuid: uuid
  }).then(data => {
    if (data.organization) {
      return data.organization
    }
  })
}

export function getPositionByUuid(uuid) {
  return API.query(GQL_GET_POSITION, {
    uuid: uuid
  }).then(data => {
    if (data.position) {
      return data.position
    }
  })
}

export function getLocationByUuid(uuid) {
  return API.query(GQL_GET_LOCATION, {
    uuid: uuid
  }).then(data => {
    if (data.location) {
      return data.location
    }
  })
}

export function getTaskByUuid(uuid) {
  return API.query(GQL_GET_TASK, {
    uuid: uuid
  }).then(data => {
    if (data.task) {
      return data.task
    }
  })
}
