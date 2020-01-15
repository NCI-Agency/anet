import React from "react"
import LinkTo from "components/LinkTo"
import { gql } from "apollo-boost"
import parse from "html-react-parser"
import API from "api"

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
      avatar(size: 256)
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

// Enhanced HTML so that links will be converted to LinkTo components
export function enhanceHtml(html, report) {
  return parse(html, {
    replace: domNode => {
      if (domNode.attribs && domNode.attribs.href) {
        var splittedUrl = domNode.attribs.href.split(/[\\//]/)
        var type = splittedUrl[splittedUrl.length - 2]
        var uuid = splittedUrl[splittedUrl.length - 1]
        return createLinkToElement(type, uuid)
      }
    }
  })
}

export async function createLinkToElement(type, uuid) {
  const org = await getOrganizationByUuid(uuid)
  switch (type) {
    case "organizations":
      return (
        <>
          <LinkTo organization={org} isLink />
        </>
      )
    default:
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
